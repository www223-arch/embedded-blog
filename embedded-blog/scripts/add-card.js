#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ???????????UTF-8
process.stdout.write('\x1b[39m');
process.stderr.write('\x1b[39m');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ???????????
const DATA_PATHS = {
  docs: path.join(__dirname, '..', 'src', 'content', 'docs.ts'),
  projects: path.join(__dirname, '..', 'src', 'content', 'projects.ts'),
  life: path.join(__dirname, '..', 'src', 'content', 'lifePosts.ts')
};

// ??????????
function readDataFile(type) {
  const filePath = DATA_PATHS[type];
  const content = fs.readFileSync(filePath, 'utf8');
  
  let data;
  let dataMatch;
  
  if (type === 'life') {
    // ????lifePosts.ts???????
    dataMatch = content.match(/export const lifePosts: LifePost\[\] = \[(.*?)\];/s);
  } else {
    // ??????????????
    dataMatch = content.match(/const \w+Raw = \[(.*?)\] as const;/s);
  }
  
  if (!dataMatch) {
    console.error('??????????????');
    process.exit(1);
  }
  
  const dataStr = dataMatch[1];
  data = eval(`[${dataStr}]`);
  
  return { content, data, dataStr, dataMatch };
}

// ???????????
function writeDataFile(type, originalContent, newData) {
  const filePath = DATA_PATHS[type];
  
  // ????????????????
  const newDataStr = newData.map((item, index) => {
    let str = JSON.stringify(item, null, 2);
    // ??????????
    str = str.replace(/,\s*$/, '');
    return str;
  }).join(',\n\n  ');
  
  let newContent;
  if (type === 'life') {
    // ??IlifePosts????
    newContent = originalContent.replace(
      /export const lifePosts: LifePost\[\] = \[(.*?)\];/s,
      `export const lifePosts: LifePost[] = [
  ${newDataStr}
];`
    );
  } else {
    // ??I????????
    newContent = originalContent.replace(
      /const \w+Raw = \[(.*?)\] as const;/s,
      `const ${type}Raw = [
  ${newDataStr}
] as const;`
    );
  }
  
  fs.writeFileSync(filePath, newContent);
  console.log(`Successfully updated ${type} data`);
}

// ????????????????
function showHelp() {
  console.log('=====================================');
  console.log('Add New Card Tool');
  console.log('=====================================');
  console.log('');
  console.log('Usage:');
  console.log('  npm run add-card <type>');
  console.log('');
  console.log('Type options:');
  console.log('  docs      - Add technical document card');
  console.log('  projects  - Add project card');
  console.log('  life      - Add life sharing card');
  console.log('');
  console.log('Steps:');
  console.log('1. Run the command to add a new card');
  console.log('2. System will automatically create a new card with default information');
  console.log('3. Run npm run generate-content to generate website content');
  console.log('4. Refresh the page in browser to see the new card');
  console.log('');
  console.log('Examples:');
  console.log('  npm run add-card docs     # Add technical document');
  console.log('  npm run add-card projects # Add project');
  console.log('  npm run add-card life     # Add life sharing');
  console.log('=====================================');
}

// ?????????????
function addDocsCard() {
  const { content, data } = readDataFile('docs');
  
  const newCard = {
    id: `doc-${Date.now()}`,
    title: 'New Technical Document',
    category: 'Programming',
    tags: ['C++', 'Tutorial'],
    level: 'beginner',
    updatedAt: new Date().toISOString().split('T')[0],
    summary: 'This is a new technical document',
    markdown: '## Overview\n\nThis is the content of a new technical document.' +
              '\n\n### Main Content\n\n- Content point 1\n- Content point 2\n- Content point 3'
  };
  
  const newData = [...data, newCard];
  writeDataFile('docs', content, newData);
  console.log('');
  console.log('Hint: Please edit the generated card content in the file:');
  console.log('src/content/docs.ts');
  console.log('Find the card with id: ' + newCard.id);
  console.log('Modify the title, content, and other information as needed.');
}

// ?????????????
function addProjectsCard() {
  const { content, data } = readDataFile('projects');
  
  const newCard = {
    id: `project-${Date.now()}`,
    title: 'New Project',
    summary: 'This is a new project description',
    stack: ['C++', 'ESP32'],
    highlights: ['Feature 1', 'Feature 2', 'Feature 3'],
    gallery: ['https://images.unsplash.com/photo-1581092921461-eab10380cb2e?auto=format&fit=crop&w=1200&q=80'],
    links: [{ label: 'View Details', href: '#' }]
  };
  
  const newData = [...data, newCard];
  writeDataFile('projects', content, newData);
  console.log('');
  console.log('Hint: Please edit the generated project information in the file:');
  console.log('src/content/projects.ts');
  console.log('Find the card with id: ' + newCard.id);
  console.log('Modify the title, description, images, and other information as needed.');
}

// ??????????????
function addLifeCard() {
  const { content, data } = readDataFile('life');
  
  const newCard = {
    id: `life-${Date.now()}`,
    title: 'New Life Sharing',
    date: new Date().toISOString().split('T')[0],
    tag: 'Life',
    summary: 'This is a new life sharing post',
    cover: ''
  };
  
  const newData = [...data, newCard];
  writeDataFile('life', content, newData);
  console.log('');
  console.log('Hint: Please edit the generated sharing information in the file:');
  console.log('src/content/lifePosts.ts');
  console.log('Find the card with id: ' + newCard.id);
  console.log('Modify the title, content, add images, and other information as needed.');
}

// ??????
function main() {
  const args = process.argv.slice(2);
  const type = args[0];
  
  if (!type || !DATA_PATHS[type]) {
    showHelp();
    process.exit(1);
  }
  
  console.log('=====================================');
  console.log('Adding new card...');
  console.log('=====================================');
  
  switch (type) {
    case 'docs':
      addDocsCard();
      break;
    case 'projects':
      addProjectsCard();
      break;
    case 'life':
      addLifeCard();
      break;
    default:
      showHelp();
      process.exit(1);
  }
  
  console.log('');
  console.log('=====================================');
  console.log('Next steps:');
  console.log('1. Edit the generated card content');
  console.log('2. Run: npm run generate-content');
  console.log('3. Refresh the page in browser to view');
  console.log('=====================================');
}

// ?????????
main();
