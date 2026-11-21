// Each task: a local page, a goal for the agent, and a check on its answer.
const path = require('path');
const page = (name) => path.join(__dirname, 'pages', name);
const test = path.join(__dirname, '..', 'test.html');
const has = (...words) => (answer) => words.every((w) => answer.toLowerCase().includes(w.toLowerCase()));

module.exports = [
  {
    name: 'fill-and-click',
    start: test,
    goal: 'Type Ada into the name box, press Greet, and tell me the greeting the page shows.',
    check: has('Hello Ada'),
  },
  {
    name: 'read-and-compare',
    start: page('shop.html'),
    goal: 'Which product is the cheapest, and what is its price?',
    check: has('Cable C', '4.99'),
  },
  {
    name: 'navigate-links',
    start: page('index.html'),
    goal: 'What is the capital of Zorbia?',
    check: has('Quillton'),
  },
  {
    name: 'dropdown-form',
    start: page('checkout.html'),
    goal: 'Choose express shipping, place the order, and tell me the order code.',
    check: has('ORD-EXP-42'),
  },
  {
    name: 'scroll-to-find',
    start: page('long.html'),
    goal: 'Find the button that reveals the secret, press it, and tell me the secret word.',
    check: has('lantern'),
  },
];
