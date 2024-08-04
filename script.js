//awesome site, save later: https://html.spec.whatwg.org/multipage/canvas.html#canvasrenderingcontext2d
//npm install -g http-server
//http-server
//then have fun at http://localhost:8080/main.html


import { Image_data } from "./Image_data.js";

const function_map = {
    'Shuffle': shuffle,
    'ZeroPatience': zeroPatienceShuffle,
    'Partial': partialShuffle,
    'Random': randomShuffle,
    'Half': halfShuffle,
    'Single': singleShuffle,
    'unShuffle': unshuffle,
    'Selection': selectionSort,
    'DoubleSelection': doubleSelectionSort,
    'Insertion': insertionSort,
    'BinaryInsertion': binaryInsertionSort,
    'FasterInsertion': fasterInsertionSort,
    'Shell': shellSort,
    'Bubble': bubbleSort,
    'Shaker': shakerSort,
    'Comb': combSort,
    'RecursiveQuick': recursiveQuickSort,
    'Quick': quickSort,
    'RandomQuick': randomQuickSort,
    'LayerQuick': layerQuickSort,
    //'TwoDQuick': twoDQuickSort, this one needs more time to mature
    'Merge': mergeSort,
}
Object.keys(function_map).forEach(key => document.getElementById(key).addEventListener('click', () => handleAnimation(function_map[key])));
document.getElementsByName('lens').forEach(radio => radio.addEventListener('change', handleLensChange));

document.getElementById('imageInput').addEventListener('change', handleImage, false);

let img_dt, img, ctx,image_data_needs_update = false;
let delay = 1/165;
const labels = {};
["Title","Width","Height","Size","Time"].forEach((label) => labels[label] = document.getElementById(label));

function write_label(text,label_name,measure) {
    if(measure === undefined) measure = "";
    const label = labels[label_name];
    label.innerText = `${label_name}: ${text}${measure}`;
}

function getActivatedLens() {
    const radios = document.getElementsByName('lens');
    for (const radio of radios) {
        if (radio.checked) {
            return radio.value;
        }
    }
    return null;
}

function handleLensChange(){
    image_data_needs_update = true;
}

function handleAnimation(functionToCall) {
    if (!img || !ctx) return console.error('Image not loaded or context not available.');

    const functionSort = functionToCall();
    
    if(image_data_needs_update) {
        img_dt = new Image_data(img, ctx, getActivatedLens(), write_label);
        image_data_needs_update = false;
    }

    img_dt.reset_stats();

    function draw() {
        if (!functionSort.next().done) {
            img_dt.redraw();
            requestAnimationFrame(draw); // Schedule the next step
        }
        img_dt.redraw();
    }

    draw(); // Start the sorting operation
}

function handleImage(e) {
    const canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    const reader = new FileReader();

    reader.onload = function(event) {
        img = new Image();
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        }
        img.src = event.target.result;
        write_label(img.width, "Width","px");
        write_label(img.height, "Height","px");
        write_label(img.width * img.height, "Size","px²");
    }
    reader.readAsDataURL(e.target.files[0]);
    image_data_needs_update = true;
}

function* swap_process(index1, index2) { 
    img_dt.swap_pixels(index1, index2);
    if (img_dt.is_redraw()) {
        yield; // Pause and save the current state
        img_dt.update();
    }
}

function* copy_auxiliar(index_begin,array){
    const values = array.map((a) => img_dt.get_value(a));
    const colors = array.map((a) => img_dt.get_color(a));
    for(let i = 0; i < array.length; i++){
        img_dt.state[index_begin + i] = values[i];
        img_dt.set_color(index_begin + i, colors[i]);
        img_dt.step += 1;
        if (img_dt.is_redraw()) {
            yield; 
            img_dt.update();
        }
    }
}

function* zeroPatienceShuffle(){
    img_dt.set_speed(15, 500_000);
    yield* shuffle();
}

function* shuffle() {
    img_dt.update();
    for (let i = 0; i < img_dt.size; i ++) {
        const j = img_dt.random_index();
        yield* swap_process(i,j);
    }
}

function* partialShuffle(){
    img_dt.update();
    const mid_point = Math.random() * 0.8 + 0.1;
    const min_lim = Math.floor(img_dt.size * (mid_point - 0.1));
    const max_lim = Math.floor(img_dt.size * (mid_point + 0.1));
    for (let i = 0; i < img_dt.size; i ++) {
        if(i >= min_lim && i <= max_lim) continue;
        let j = img_dt.random_index();
        while(j >= min_lim && j <= max_lim) j = img_dt.random_index();
        yield* swap_process(i,j);
    }
}

function* randomShuffle(){
    img_dt.update();
    for (let i = 0; i < img_dt.size/4; i ++) {
        const k = img_dt.random_index();
        const j = img_dt.random_index();
        yield* swap_process(k,j);
    }
}

function* halfShuffle(){
    img_dt.update();
    for (let i = 0; i < img_dt.size/2; i ++) {
        const j = img_dt.random_index();
        yield* swap_process(i,j);
    }
}

function* singleShuffle(){
    img_dt.update();
    const i = img_dt.random_index();
    const j = img_dt.random_index();
    yield* swap_process(i,j);
}

function* unshuffle(){
    img_dt.set_speed(delay);
    let i = 0;
    while(i < img_dt.size){
        const j = img_dt.get_value(i);
        if(i == j) i++;
        else yield* swap_process(i,j);
    }
}

function* selectionSort(){
    img_dt.set_speed(delay);
    for(let index1 = 0; index1 < img_dt.size; index1++){
        let minIndex = index1;
        let minValue = img_dt.get_value(index1);
        for(let i = index1 + 1; i < img_dt.size; i++){
            const value = img_dt.get_value(i);
            if(value < minValue){
                minIndex = i;
                minValue = value;
            }
        }
        if(minIndex != index1) yield* swap_process(index1, minIndex);
    }
}

function* doubleSelectionSort(){
    img_dt.set_speed(delay);
    for(let index1 = 0; index1 < img_dt.size/2; index1++){
        let index2 = img_dt.size - index1 - 1;
        let minIndex = index1;
        let minValue = img_dt.get_value(index1);
        let maxIndex = index2;
        let maxValue = img_dt.get_value(index2);
        for(let i = index1 + 1; i < index2 - 1; i++){
            let value = img_dt.get_value(i);
            if(value < minValue){
                minIndex = i;
                minValue = value;
            }else if(value > maxValue){
                maxIndex = i;
                maxValue = value;
            }
        }
        if(minIndex != index1) yield* swap_process(index1, minIndex);
        if(maxIndex != index2) yield* swap_process(index2, maxIndex);
    }
}

function* insertionSort(){
    img_dt.set_speed(15,500_000);
    for(let index1 = 1; index1 < img_dt.size; index1++){
        var value = img_dt.get_value(index1);
        let place_to_insert = index1;
        while((place_to_insert > 0) && (value < img_dt.get_value(place_to_insert - 1))) place_to_insert--;
        for(let i = index1; i > place_to_insert; i--) yield* swap_process(i, i - 1);
    }
}

function* binaryInsertionSort(){
    img_dt.set_speed(15,500_000);
    for(let index1 = 1; index1 < img_dt.size; index1++){
        let value = img_dt.get_value(index1);
        let left = 0;
        let right = index1;
        while(left < right){
            const middle = Math.floor((left + right) / 2);
            if(value < img_dt.get_value(middle)){
                right = middle;
            }else{
                left = middle + 1;
            }
        }
        for(let i = index1; i > left; i--) yield* swap_process(i, i - 1);
        //for(let i = left; i < index1; i++) yield* swap_process(index1, i); //this is the same, but different visual effect
    }
}

function* fasterInsertionSort(){ //only works with horizontal lens
    img_dt.set_speed(delay);
    for(let index1 = 1; index1 < img_dt.size; index1++){
        let value = img_dt.get_value(index1);
        let left = 0;
        let right = index1;
        while(left < right){
            const middle = Math.floor((left + right) / 2);
            if(value < img_dt.get_value(middle)){
                right = middle;
            }else{
                left = middle + 1;
            }
        }
        const values = img_dt.data.slice(4*index1, 4*(index1 + 1));
        img_dt.data.copyWithin(4*(left + 1), 4*left, 4*index1);
        img_dt.data.set(values, 4*left);
        img_dt.state.copyWithin(left + 1, left, index1);
        img_dt.state[left] = value;
        img_dt.step += 1;
        if (img_dt.is_redraw()) {
            yield; // Pause and save the current state
            img_dt.update();
        }
    }
}

function* shellSort(){
    //TODO: fix, it's not working
    img_dt.set_speed(delay, 500_000);
    let gap = img_dt.size;
    while(gap > 1){
        gap = Math.floor(gap / 2.3); 
        for(let index1 = gap; index1 < img_dt.size; index1++){
            let value = img_dt.get_value(index1);
            let index2 = index1;
            while(index2 >= gap && value < img_dt.get_value(index2 - gap)){
                yield* swap_process(index2, index2 - gap);
                index2 -= gap;
            }
        }
    }
}

function* bubbleSort(){
    img_dt.set_speed(5, 500_000);
    for(let index1 = 0; index1 < img_dt.size - 1; index1++){
        for(let i = 0; i < img_dt.size - index1 - 1; i++){
            if(img_dt.get_value(i) > img_dt.get_value(i + 1)) yield* swap_process(i, i + 1);
        }
    }
}

function* shakerSort(){
    img_dt.set_speed(5, 500_000);
    for(let index1 = 0; index1 < img_dt.size - 1; index1++){
        let numSwaps = 0;
        for(let i = 0; i < img_dt.size - index1 - 1; i++){
            if(img_dt.get_value(i) > img_dt.get_value(i + 1)){
                yield* swap_process(i, i + 1);
                numSwaps++;
            }
        }
        for(let i = img_dt.size - index1 - 1; i > 0; i--){
            if(img_dt.get_value(i) < img_dt.get_value(i - 1)){
                yield* swap_process(i, i - 1);
                numSwaps++;
            }
        }
    }
}

function* combSort(){
    img_dt.set_speed(delay, 500_000);
    let gap = img_dt.size;
    let numSwaps = 0;
    while(!(gap == 1 && numSwaps == 0)){
        numSwaps = 0;
        for(let index1 = 0; index1 < img_dt.size - gap; index1++){
            const index2 = index1 + gap;
            if(img_dt.get_value(index1) > img_dt.get_value(index2)){
                yield* swap_process(index1, index2);
                numSwaps++;
            }
        }
        if(gap!=1) gap = Math.floor(gap / 1.3);
    }
}

function* roundQuickSortBase(img_dt, left, right, wrapper){
    if(left >= right) return;
    const pivot = img_dt.get_value(left);
    let i = left + 1;
    let j = wrapper.j;
    while(i <= j){
        let value_i = img_dt.get_value(i);
        while(value_i < pivot){
            i++;
            if(i > j) break;
            value_i = img_dt.get_value(i);
        }
        let value_j = img_dt.get_value(j);
        while(value_j > pivot){
            j--;
            if(j < i) break;
            value_j = img_dt.get_value(j);
        }
        if(i > j) break;
        yield* swap_process(i, j);
    }
    yield* swap_process(left, j);
    wrapper.j = j;
}

function* roundQuickSortRecursive(img_dt, left, right, deepness){
    if(deepness === undefined) deepness = 0;
    else deepness++;
    //console.log(deepness);
    if(deepness > 4000) {
        throw new Error("Stack overflow");
    }
    const wrapper = {j: right};
    yield* roundQuickSortBase(img_dt, left, right, wrapper);
    if(left < wrapper.j - 1) yield* roundQuickSortRecursive(img_dt, left, wrapper.j - 1, deepness);
    if(wrapper.j + 1 < right) yield* roundQuickSortRecursive(img_dt, wrapper.j + 1, right, deepness);
    deepness--;
    console.log(deepness);
}

function* recursiveQuickSort(){
    img_dt.set_speed(delay, 500_000);
    yield* roundQuickSortRecursive(img_dt, 0, img_dt.size - 1);
}

function* quickSortBase(img_dt, left, right, get_from_stack){
    if(get_from_stack === undefined) console.error("get_from_stack is undefined");
    img_dt.set_speed(delay, 500_000);
    let stack = [];
    stack.push([left,right]);
    while(stack.length > 0){
        [stack, left, right] = get_from_stack(stack);
        if(left >= right) continue;
        const wrapper = {j: right};
        yield* roundQuickSortBase(img_dt, left, right, wrapper);
        if(wrapper.j + 1 < right) stack.push([wrapper.j + 1, right]);
        if(left < wrapper.j - 1) stack.push([left, wrapper.j - 1]);
    }
}

function* quickSort(){
    const get_from_stack = (stack) => {
        const value = stack.pop();
        return [stack, value[0], value[1]];
    }
    yield* quickSortBase(img_dt, 0, img_dt.size - 1, get_from_stack);
}

function* randomQuickSort(){
    const get_from_stack = (stack) => {
        const index = Math.floor(Math.random() * stack.length);
        const value = stack[index];
        if (index > 0 && index < stack.length) {
            stack = stack.slice(0, index).concat(stack.slice(index + 1));
        }else if (index == 0) stack = stack.slice(1)
        else stack = stack.slice(0, stack.length - 1);
        return [stack, value[0], value[1]];
    }
    yield* quickSortBase(img_dt, 0, img_dt.size - 1, get_from_stack);
}

function* layerQuickSort(){
    const get_from_stack = (stack) => {
        const value = stack.shift();
        return [stack, value[0], value[1]];
    }
    yield* quickSortBase(img_dt, 0, img_dt.size - 1, get_from_stack);
}

function* merge(img_dt, left, middle, right){ //swap based merge
    let i = left;
    let j = middle + 1;
    let auxiliar = [];
    while(i <= middle || j <= right){
        if(i > middle){
            auxiliar.push(j++);
            continue;
        }
        if(j > right){
            auxiliar.push(i++);
            continue;
        }
        if(img_dt.get_value(i) > img_dt.get_value(j)) auxiliar.push(j++);
        else auxiliar.push(i++);
    }
    console.log(auxiliar);
    yield* copy_auxiliar(left, auxiliar);
}

function* roundMergeSort(img_dt, left, right){
    if(left >= right) return;
    const middle = Math.floor((left + right) / 2);
    yield* roundMergeSort(img_dt, left, middle);
    yield* roundMergeSort(img_dt, middle + 1, right);
    yield* merge(img_dt, left, middle, right);
}

function* mergeSort(){
    img_dt.set_speed(delay, 500_000);
    yield* roundMergeSort(img_dt, 0, img_dt.size - 1);
}