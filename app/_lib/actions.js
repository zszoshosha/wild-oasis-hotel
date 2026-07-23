"use server";

import { z } from "zod";
import { auth, signIn, signOut } from "./auth";
import { createClient } from "../../utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const bookingDataSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  numNights: z.coerce.number().int().positive(),
  cabinPrice: z.coerce.number().nonnegative(),
  cabinId: z.coerce.number().int().positive(),
});

const createBookingFormSchema = z.object({
  numGuests: z.coerce.number().int().positive(),
  observations: z.string().trim().max(1000).catch(""),
});

const updateBookingFormSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
  numGuests: z.coerce.number().int().positive(),
  observations: z.string().trim().max(1000).catch(""),
});

function parseFormData(formData, schema) {
  const values = Object.fromEntries(formData.entries());
  return schema.parse(values);
}

export async function updateGuest(formData) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  const supabase = await createClient();

  const nationalID = formData.get("nationalID");
  const [nationality, countryFlag] = formData.get("nationality").split("%");

  if (!/^[a-zA-Z0-9]{6,12}$/.test(nationalID))
    throw new Error("Please provide a valid national ID");

  const updateData = { nationality, countryFlag, nationalID };

  const { data, error } = await supabase
    .from("guests")
    .update(updateData)
    .eq("id", session.user.guestId);

  if (error) throw new Error("Guest could not be updated");

  revalidatePath("/account/profile");
}

export async function createBooking(bookingData, formData) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  const supabase = await createClient();

  const parsedBookingData = bookingDataSchema.parse(bookingData);
  const parsedFormData = parseFormData(formData, createBookingFormSchema);

  const newBooking = {
    ...parsedBookingData,
    guestId: session.user.guestId,
    numGuests: parsedFormData.numGuests,
    observations: parsedFormData.observations,
    extrasPrice: 0,
    totalPrice: parsedBookingData.cabinPrice,
    isPaid: false,
    hasBreakfast: false,
    status: "unconfirmed",
  };

  const { data: createdBooking, error } = await supabase
    .from("bookings")
    .insert([newBooking])
    .select()
    .single();

  if (error) throw new Error("Booking could not be created");

  revalidatePath(`/cabins/${createdBooking.cabinId}`);

  redirect("/cabins/thankyou");
}

export async function deleteBooking(bookingId) {
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  const supabase = await createClient();

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("guestId")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) throw new Error("Booking not found");

  if (booking.guestId !== session.user.guestId) {
    throw new Error("You are not allowed to delete this booking");
  }

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (error) throw new Error("Booking could not be deleted");

  revalidatePath("/account/reservations");
}

export async function updateBooking(formData) {
  const { bookingId, numGuests, observations } = parseFormData(
    formData,
    updateBookingFormSchema,
  );

  const supabase = await createClient();

  // 1) Authentication
  const session = await auth();
  if (!session) throw new Error("You must be logged in");

  // 2) Authorization
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("guestId")
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) throw new Error("Booking not found");

  if (booking.guestId !== session.user.guestId) {
    throw new Error("You are not allowed to update this booking");
  }

  // 3) Building update data
  const updateData = {
    numGuests,
    observations,
  };

  // 4) Mutation
  const { error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId)
    .select()
    .single();

  // 5) Error handling
  if (error) throw new Error("Booking could not be updated");

  // 6) Revalidation
  revalidatePath(`/account/reservations/edit/${bookingId}`);
  revalidatePath("/account/reservations");

  // 7) Redirecting
  redirect("/account/reservations");
}

export async function signInAction() {
  await signIn("google", { redirectTo: "/account" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
