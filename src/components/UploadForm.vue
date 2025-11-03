<template>
  <div>
    <h4>Discord Channel: <a href="https://discord.com/channels/181078474394566657/1329277071091957841">https://discord.com/channels/181078474394566657/1329277071091957841</a></h4>
    <br>
    <h3>How to use:</h3>
    <h4>1. Make a copy of the Spreadsheet: <a href="https://docs.google.com/spreadsheets/d/14bIekbw2_3LEKc0t8HNCKFUHX9fiLgJQ0P_J_W0HUT8/edit?usp=sharing">https://docs.google.com/spreadsheets/d/14bIekbw2_3LEKc0t8HNCKFUHX9fiLgJQ0P_J_W0HUT8/edit?usp=sharing</a></h4>
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
    <input type="checkbox" id="checkbox" v-model="transform_GT_meta" />


    <label for="checkbox">Transform GT5u Items (should work for 2.8.1): {{ transform_GT_meta }}</label>
    <br>
    <br>
    Matches id via level.dat to name, matches name to Display Name via NEI dump
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
    <textarea
      v-model="output"
      rows="5"
      cols="120"
      readonly
      style="white-space: pre; font-family: monospace"
    ></textarea>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import pako from 'pako'
import Papa from 'papaparse'
import { Buffer } from 'buffer'
import { Repository } from 'https://shadowtheage.github.io/gtnh/repository.js'
import { ungzip } from 'pako';


// Read gzipped binary file
//import dataUrl from '@/assets/data.bin';




const nbtFile = ref(null)
const levelFile = ref(null)
const output = ref('')
const transform_GT_meta = ref(true);

const nbt = require('prismarine-nbt')

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
      ? pako.ungzip(new Uint8Array(nbtData))
      : new Uint8Array(nbtData)

    const parsed = await parseNBT(Buffer.from(buffer))

    const nbtData_level = await readFileAsArrayBuffer(levelFile.value)
    const buffer_level = isGzipped(new Uint8Array(nbtData_level))
      ? pako.ungzip(new Uint8Array(nbtData_level))
      : new Uint8Array(nbtData_level)
    const parsed_level = await parseNBT(Buffer.from(buffer_level))
    console.log(parsed_level);
  const name_id_matcher = parsed_level.value.FML.value.ItemData.value.value.map(x =>  ({id: x.V.value, tag: x.K.value.slice(1)}));

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


const eaten_tags = eaten_ids.map(x => ({tag: IdToTag[x.id], ...x}));
console.log(eaten_tags)

      const baseUrl = import.meta.env.BASE_URL || '/';

      const response = await fetch(baseUrl+'/item.csv')
    if (!response.ok) {
      throw new Error(`Failed to fetch item.csv: ${response.status} ${response.statusText}`)
    }
    const csvText = await response.text();
    const results = Papa.parse(csvText, { header: true }).data


    const response_GT = await fetch(baseUrl+'/metaitem02.csv')
    if (!response_GT.ok) {
      throw new Error(`Failed to fetch metaitem.CSV: ${response.status} ${response.statusText}`)
    }
    const csvText_GT = await response_GT.text();
    const results_GT = Papa.parse(csvText_GT, { header: true }).data
    const metaItemConvert = [];
    results_GT.forEach(x => {
      metaItemConvert[x.metaID] = x.stackName;
    })

    console.log(metaItemConvert);


    const TagToName = []
    results.forEach((x) => {
      TagToName[x.Name] = { name: x['Display Name'], modshort: ModToShort(x['Mod']) }
    })


    const response_data = await fetch("https://shadowtheage.github.io/gtnh/data/data.bin").then(x => x.arrayBuffer());

    const repo = Repository.load(ungzip(response_data).buffer);

    output.value = JSON.stringify(eaten_tags.map((x) => {
        let temp = { ...TagToName[x.tag] };

      if(x.tag == "gregtech:gt.metaitem.02" && transform_GT_meta.value) {
        temp.name = metaItemConvert[x.damage]
        temp.gt_meta = true;
      }
      temp.damage = x.damage;

      if(x.tag == "minecraft:golden_apple") {
        if(temp.damage == 0) {
          temp.name = "Golden Apple (Ingots)";
        }
        else if(temp.damage == 1) {
          temp.name = "Golden Apple (Blocks)";
          temp.damage = 0;
        }
      }

      if(temp.damage != 0 && !temp.gt_meta) {
        const item = repo.GetById("i:" + x.tag + ":" + x.damage); // ✅ call on instance!
        console.log(item);
        temp.name = item.name;
        // temp.modshort += " - DAMAGE:" + temp.damage;
      }

      delete temp.damage;
      return temp || { name: x, modshort: '', notfound: true };

    }))






  } catch (err) {
    output.value = err.toString()
  }
}
</script>
