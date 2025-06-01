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
  style="white-space: pre; font-family: monospace;"
></textarea>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { parse as parseNBT } from 'prismarine-nbt';
import pako from 'pako';
import Papa from 'papaparse';
import { Buffer } from 'buffer';

const nbtFile = ref(null);
const output = ref('');

function onNBTChange(e) {
  nbtFile.value = e.target.files[0];
}


function ModToShort(mod) {
  switch (mod) {
    case 'gregtech': return '(GT)';
    case 'harvestcraft': return "(Pam's)";
    default: return mod;
  }
}

async function process() {
  try {
  const nbtData = await readFileAsArrayBuffer(nbtFile.value);
  const buffer = isGzipped(new Uint8Array(nbtData))
    ? pako.ungzip(new Uint8Array(nbtData))
    : new Uint8Array(nbtData);

  const { parsed } = await new Promise((resolve, reject) =>
    parseNBT(Buffer.from(buffer), (err, data) => err ? reject(err) : resolve({ parsed: data }))
  );

  const ids = parsed.value.ForgeData.value.PlayerPersisted.value.SpiceOfLifeHistory.value.FullHistory.value.Foods.value.value.map(x => x.id.value);

  const csvText = await fetch('/item.csv').then(x => x.text());
  const results = Papa.parse(csvText, { header: true }).data;

  const IdToName = [];
  results.forEach(x => {
    IdToName[x.ID] = { name: x['Display Name'], modshort: ModToShort(x['Mod']) };
  });

  output.value = JSON.stringify(ids.map(x => IdToName[x] || { name: x, modshort: '' }));
} catch (err) {
  output.value = err;
}
}

function isGzipped(bytes) {
  return bytes[0] === 0x1f && bytes[1] === 0x8b;
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
</script>
