console.log('init memory-master');
let durations = {
  light_on: 500,
  light_interval: 250,
  flash_on: 250,
  flash_interval: 125,
  input_buffer: 500,
};
let box = document.getElementById('box');
let lights = box.getElementsByClassName('light');
let center_box;
let direction_boxes = [];
for (let i = 0; i < lights.length; i++) {
  let light = lights.item(i);
  let button = light.parentElement;
  let direction = button.id;
  let box = {
    direction,
    button,
    light,
  };
  if (direction === 'center') {
    center_box = box
  } else {
    direction_boxes.push(box)
  }
  button.addEventListener('mousedown', () => active(box));
  button.addEventListener("pointerdown", () => active(box));
  button.addEventListener("mouseup", () => deactive(box));
  button.addEventListener("pointerup", () => deactive(box));
  deactive(box)
}

function active(box) {
  box.light.style.display = 'block';
}

function deactive(box) {
  box.light.style.display = 'none';
}

let box_sequences = [];

function wait(ns) {
  return new Promise(resolve => setTimeout(resolve, ns))
}

async function showSequences() {
  for (let box of box_sequences) {
    active(box);
    await wait(durations.light_on);
    deactive(box);
    await wait(durations.light_interval);
  }
}

function addSequence() {
  let idx = Math.floor(Math.random() * direction_boxes.length);
  let box = direction_boxes[idx];
  box_sequences.push(box)
}

let state = 'idle';

async function play() {
  await showSequences();
}

// return 'correct' or 'wrong'
async function input() {
  debugger;
  console.log('targets:', box_sequences.map(box => box.direction))
  for (let targetBox of box_sequences) {
    console.log('target:', targetBox.direction)
    let result = await new Promise((resolve) => {
      let check = (ev) => {
        for (let box of direction_boxes) {
          box.button.removeEventListener("mouseup", check);
          box.button.removeEventListener("pointerup", check);
        }
        let direction = ev.currentTarget.id;
        console.log('input:', direction)
        if (direction === targetBox.direction) {
          // correct
          resolve('correct')
        } else {
          // wrong
          resolve('wrong')
        }
      };
      for (let box of direction_boxes) {
        box.button.addEventListener("mouseup", check);
        box.button.addEventListener("pointerup", check);
      }
    });
    console.log('result:', result);
    if (result === 'wrong') {
      return 'wrong'
    }
  }
  return 'correct'
}

async function reset() {
  box_sequences = [];
  for (let i = 0; i < 3; i++) {
    active(center_box);
    await wait(durations.flash_on);
    deactive(center_box);
    await wait(durations.flash_interval)
  }
}

async function nextState(ev) {
  let caller = ev ? ev.type : 'code'
  console.log('nextState, from:', state, 'caller:', caller);
  await wait(durations.input_buffer);
  switch (state) {
    case "idle":
      addSequence();
      state = 'play';
      return nextState();
    case 'play':
      await play();
      state = 'input';
      return nextState();
    case 'input':
      let result = await input();
      debugger;
      switch (result) {
        case 'correct':
          addSequence();
          state = 'play';
          return nextState();
        case 'wrong':
          await reset();
          state = 'idle';
          return;
        default:
          console.error('unknown result of input():', result);
          return
      }
  }
}

center_box.button.addEventListener('mouseup', nextState);
center_box.button.addEventListener('pointerup', nextState);

console.log('ready');
