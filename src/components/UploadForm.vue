<template>
  <div>
    <h2>Convert PlayerData NBT into SpiceOfLife History JSON</h2>
    <input type="file" @change="onNBTChange" />
    <button @click="process" :disabled="!nbtFile">Process</button>
    <textarea
      v-model="output"
      rows="20"
      cols="80"
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

const nbtFile = ref(null)
const output = ref('')

const nbt = require('prismarine-nbt')

function onNBTChange(e) {
  nbtFile.value = e.target.files[0]
}

function ModToShort(mod) {
  switch (mod) {
    case 'gregtech':
      return '(GT)'
    case 'harvestcraft':
      return "(Pam's)"
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

    // Access the NBT structure - adjust if your structure differs
    const ids =
      parsed.value.ForgeData.value.PlayerPersisted.value.SpiceOfLifeHistory.value.FullHistory.value.Foods.value.value.map(
        (x) => x.id.value,
      )
      const baseUrl = import.meta.env.BASE_URL || '/';

      const response = await fetch(baseUrl+'/item.csv')
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`)
    }
    const csvText = await response.text();
    const results = Papa.parse(csvText, { header: true }).data

    const IdToName = []
    results.forEach((x) => {
      IdToName[x.ID] = { name: x['Display Name'], modshort: ModToShort(x['Mod']) }
    })

    output.value = JSON.stringify(
      ids.map((x) => IdToName[x] || { name: x, modshort: '' }),
      null,
      2,
    )
  } catch (err) {
    output.value = err.toString()
  }
}
</script>
