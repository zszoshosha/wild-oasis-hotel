const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const fileContent = fs.readFileSync(filePath, "utf8");

  for (const rawLine of fileContent.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(process.cwd(), ".env.local"));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_KEY. Add them to .env.local or your environment.",
  );
}

const cabinImageBase =
  "https://zvdwvywrbyabzobxfttv.supabase.co/storage/v1/object/public/cabin-images";

const cabins = [
  {
    id: 1,
    name: "001",
    maxCapacity: 2,
    regularPrice: 250,
    discount: 0,
    image: `${cabinImageBase}/cabin-001.jpg`,
    description:
      "Discover the ultimate luxury getaway for couples in the cozy wooden cabin 001. Nestled in a picturesque forest, this stunning cabin offers a secluded and intimate retreat. Inside, enjoy modern high-quality wood interiors, a comfortable seating area, a fireplace, and a fully equipped kitchen. The plush king-size bed and private deck create a peaceful escape.",
  },
  {
    id: 2,
    name: "002",
    maxCapacity: 2,
    regularPrice: 300,
    discount: 50,
    image: `${cabinImageBase}/cabin-002.jpg`,
    description:
      "A bright and stylish cabin for two with warm finishes, a private hot tub, and mountain views. Perfect for a romantic stay or a quiet solo retreat.",
  },
  {
    id: 3,
    name: "003",
    maxCapacity: 4,
    regularPrice: 420,
    discount: 0,
    image: `${cabinImageBase}/cabin-003.jpg`,
    description:
      "A comfortable family cabin with extra living space, a roomy kitchen, and a relaxed layout designed for longer stays in the Dolomites.",
  },
  {
    id: 4,
    name: "004",
    maxCapacity: 4,
    regularPrice: 480,
    discount: 50,
    image: `${cabinImageBase}/cabin-004.jpg`,
    description:
      "A premium four-person cabin with a spacious deck, elegant wood interiors, and plenty of room for a small group to unwind together.",
  },
  {
    id: 5,
    name: "005",
    maxCapacity: 6,
    regularPrice: 620,
    discount: 100,
    image: `${cabinImageBase}/cabin-005.jpg`,
    description:
      "Ideal for group trips, this cabin offers six beds, open living areas, and a private outdoor space for evenings under the stars.",
  },
  {
    id: 6,
    name: "006",
    maxCapacity: 4,
    regularPrice: 550,
    discount: 75,
    image: `${cabinImageBase}/cabin-006.jpg`,
    description:
      "A secluded cabin with a calm atmosphere, high-end finishes, and cozy interiors made for a restful mountain holiday.",
  },
  {
    id: 7,
    name: "007",
    maxCapacity: 8,
    regularPrice: 890,
    discount: 150,
    image: `${cabinImageBase}/cabin-007.jpg`,
    description:
      "The largest cabin in the set, ideal for big groups who want a luxurious base with generous communal areas and privacy.",
  },
  {
    id: 8,
    name: "008",
    maxCapacity: 8,
    regularPrice: 980,
    discount: 200,
    image: `${cabinImageBase}/cabin-008.jpg`,
    description:
      "A high-end group cabin with panoramic views, a refined interior, and a resort-like feel for extended stays in the mountains.",
  },
];

const settings = {
  id: 1,
  minbookinglength: 3,
  maxbookinglength: 90,
  maxguestsperbooking: 8,
  breakfastprice: 15,
};

async function main() {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { error: cabinError } = await supabase
    .from("cabins")
    .upsert(cabins, { onConflict: "id" });

  if (cabinError) {
    throw cabinError;
  }

  const { error: settingsError } = await supabase
    .from("settings")
    .upsert(settings, { onConflict: "id" });

  if (settingsError) {
    throw settingsError;
  }

  console.log(
    `Seeded ${cabins.length} cabins and 1 settings row successfully.`,
  );
}

main().catch((error) => {
  console.error("Seed failed:");
  console.error(error);
  process.exit(1);
});
