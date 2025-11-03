<template>
  <div>
    <h4>Discord Channel: <a
        href="https://discord.com/channels/181078474394566657/1329277071091957841">https://discord.com/channels/181078474394566657/1329277071091957841</a>
    </h4>
    <br>
    <h3>How to use:</h3>
    <h4>1. Make a copy of the Spreadsheet: <a
        href="https://docs.google.com/spreadsheets/d/14bIekbw2_3LEKc0t8HNCKFUHX9fiLgJQ0P_J_W0HUT8/edit?usp=sharing">https://docs.google.com/spreadsheets/d/14bIekbw2_3LEKc0t8HNCKFUHX9fiLgJQ0P_J_W0HUT8/edit?usp=sharing</a>
    </h4>
    <h4>2. Add the Spreadsheet Script: <a href="./AutoImport.gs">AutoImport.gs</a></h4>
    <h4>3. Convert playerdata and level.dat to JSON.</h4>
    <h4>4. Paste into A1 in All Sheet</h4>
    <h4>5. Run Food Tools Import via the button in the Top Bar next to Help / Ask Gemini</h4>

    <br>
    <h3>Thanks and Credits to:</h3>
    Fox - Creating the Spreadsheet
    <br>LioHD - Helping setup the Data Transformation
    <br>ShadowTheAge - GTNH NEI Repository to fetch Item Names
    <br>
    <br>
    Matches id via level.dat to name, matches name to Display Name via <a
      href="https://shadowtheage.github.io/gtnh/">ShadowTheAge NEI</a>
    <br>
    <br>
    <h2>Convert PlayerData NBT into SpiceOfLife History JSON</h2>
    <h4>level.dat:</h4>
    <input type="file" @change="onLevelChange" />
    <h4>playerdata.dat</h4>
    <input type="file" @change="onNBTChange" />
    <br>
    <br>
    <button @click="process" :disabled="!nbtFile || !levelFile">Process</button>
    <br>
    <br>
    <textarea v-model="output" rows="5" cols="120" readonly style="white-space: pre; font-family: monospace"></textarea>
    <br>
    <p>Last update: {{ formattedDate }}   // {{ gitCommit }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Buffer } from 'buffer'
import { Repository } from 'https://shadowtheage.github.io/gtnh/repository.js'
import { ungzip } from 'pako';
import { decode } from "html-entities";


const nbtFile = ref(null)
const levelFile = ref(null)
const output = ref('')

// eslint-disable-next-line no-undef
const nbt = require('prismarine-nbt')


const lastUpdate = new Date(import.meta.env.VITE_BUILD_DATE).toLocaleString();
const formattedDate = new Date(lastUpdate).toLocaleString();
const gitCommit = import.meta.env.LAST_COMMIT + " - " + import.meta.env.NOT_COMMITED + " unstaged changes";

function onLevelChange(e) {
  levelFile.value = e.target.files[0]
}

function onNBTChange(e) {
  nbtFile.value = e.target.files[0]
}

function ModToShort(mod) {
  switch (mod) {
    case 'gregtech':
      return '(GT)'
    case 'harvestcraft':
      return "(Pam)"
    case 'Natura':
      return "(Natura)"
    case 'Forestry':
      return "(Forestry)"
    case 'TConstruct':
      return "(TiC)"
    case 'ExtraTrees':
      return "(ET)"
    case 'TwilightForest':
      return "(TF)"
    case 'witchery':
      return "(Witchery)"
    case 'ThaumicHorizons':
      return "(TC)"
    case 'etfuturum':
      return "(EFR)"
    case 'BiomesOPlenty':
      return "(BoP)"
    case 'cookingforblockheads':
      return "(Cooking for BH)"
    case 'minecraft':
      return "(Vanilla)"
    default:
      return mod
  }
}

function parseNBT(buffer) {
  // Wrap the callback version in a Promise for easier async/await usage
  return new Promise((resolve, reject) => {
    nbt.parse(buffer, (error, data) => {
      if (error) reject(error)
      else resolve(data)
    })
  })
}

function isGzipped(bytes) {
  return bytes[0] === 0x1f && bytes[1] === 0x8b
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

async function process() {
  if (!nbtFile.value) return

  try {
    const nbtData = await readFileAsArrayBuffer(nbtFile.value)
    const buffer = isGzipped(new Uint8Array(nbtData))
      ? ungzip(new Uint8Array(nbtData))
      : new Uint8Array(nbtData)

    const parsed = await parseNBT(Buffer.from(buffer))

    const nbtData_level = await readFileAsArrayBuffer(levelFile.value)
    const buffer_level = isGzipped(new Uint8Array(nbtData_level))
      ? ungzip(new Uint8Array(nbtData_level))
      : new Uint8Array(nbtData_level)
    const parsed_level = await parseNBT(Buffer.from(buffer_level))
    console.log(parsed_level);
    const name_id_matcher = parsed_level.value.FML.value.ItemData.value.value.map(x => ({ id: x.V.value, tag: x.K.value.slice(1) }));

    const IdToTag = [];

    name_id_matcher.forEach((x) => {
      IdToTag[x.id] = x.tag;
    })
    console.log(IdToTag);

    // Access the NBT structure - adjust if your structure differs
    const eaten_ids =
      parsed.value.ForgeData.value.PlayerPersisted.value.SpiceOfLifeHistory.value.FullHistory.value.Foods.value.value.map(
        (x) => ({
          id: x.id?.value,
          damage: x.Damage?.value ?? 0,
        })
      );


    const eaten_tags = eaten_ids.map(x => ({ tag: IdToTag[x.id], ...x }));
    console.log(eaten_tags)

    const response_data = await fetch("https://shadowtheage.github.io/gtnh/data/data.bin").then(x => x.arrayBuffer());

    const repo = Repository.load(ungzip(response_data).buffer);

    const pamFix = {
      "harvestcraft:pamcarrotCake": "Carrot Cake",
      "harvestcraft:pamcheeseCake": "Cheese Cake",
      "harvestcraft:pamcherrycheeseCake": "Cherry Cheese Cake",
      "harvestcraft:pampineappleupsidedownCake": "Pineapple Upside Down Cake",
      "harvestcraft:pamchocolatesprinkleCake": "Chocolate Sprinkles Cake",
      "harvestcraft:pamredvelvetCake": "Red Velvet Cake",
      "harvestcraft:pamlamingtonCake": "Lamington",
      "harvestcraft:pampavlovaCake": "Pavlova",
      "harvestcraft:pamholidayCake": "Holiday Cake",
      "harvestcraft:pampumpkincheeseCake": "Pumpkin Cheese Cake"
    };

    output.value = JSON.stringify(eaten_tags.map((x) => {
      let temp = {};

      // Override for Golden Apples
      if (x.tag == "minecraft:golden_apple") {
        if (x.damage == 0) {
          temp.name = "Golden Apple (Ingots)";
        }
        else if (x.damage == 1) {
          temp.name = "Golden Apple (Blocks)";
        }

        // Override for PamHarvestcraft Cakes
      } else if (pamFix[x.tag]) {
        temp.name = pamFix[x.tag];
        temp.modshort = ModToShort("harvestcraft");

        // Default - get from Repository
      } else {
        const itemRepoTag = "i:" + x.tag + ":" + x.damage;
        let item = repo.GetById(itemRepoTag);

        if (item == null) {
          console.error(itemRepoTag);
          return { name: itemRepoTag, modshort: '- ERROR IN DB LOOKUP', notfound: true };
        }

        temp.name = item.name;
        temp.modshort = ModToShort(item.mod);
      }

      if (temp.modshort == "(GT)" && temp.name == "Dough") {
        switch (x.damage) {
          case 32561:
            temp.name = "Dough in Bread Shape";
            break;
          case 32562:
            temp.name = "Dough in Bun Shape";
            break;
          case 32563:
            temp.name = "Dough in Baguette Shape";
            break;
          default:
            break;
        }
      }

      if (temp.modshort == "(Natura)" && x.tag == "Natura:natura.stewbowl") {
        if(x.damage >= 14) {
          temp.name = "Glowshroom ";
        } else {
          temp.name = "Mushroom ";
        }

        switch (x.damage % 14) {
          case 0:
            temp.name += "Stew 1";
            break;
          case 3:
            temp.name += "Stew 2";
            break;
          case 5:
            temp.name += "Stew 3";
            break;
          case 12:
            temp.name += "Stew 4";
            break;
          case 13:
            temp.name += "Stew 5";
            break;
          default:
            break;
        }
      }


      // Decode HTML Item Names
      temp.name = decode(temp.name);

      return temp || { name: x, modshort: ' - ERROR', notfound: true };

    }))

  } catch (err) {
    output.value = err.toString()
  }
}
</script>
