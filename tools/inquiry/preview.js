#!/usr/bin/env node
// Render an inquiry email from JSON, without sending anything.
//   node preview.js < sample.json > /tmp/inquiry.html          (HTML part)
//   node preview.js --text < sample.json                       (plain-text part)
// Input: the render() options of ../../assets/inquiry/email.js.
import { readFileSync } from 'node:fs';
import { render } from '../../assets/inquiry/email.js';

const input = JSON.parse(readFileSync(0, 'utf8'));
const { html, text } = render(input);
process.stdout.write((process.argv.includes('--text') ? text : html) + '\n');
