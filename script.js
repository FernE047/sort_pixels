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
    'Cycle': cycleSort,
    'Selection': selectionSort,
    'DoubleSelection': doubleSelectionSort,
    'Heap': heapSort,
    'Insertion': insertionSort,
    'BinaryInsertion': binaryInsertionSort,
    'FasterInsertion': fasterInsertionSort,
    'Shell': shellSort,
    'Gnome': gnomeSort,
    'Bubble': bubbleSort,
    'Shaker': shakerSort,
    'Comb': combSort,
    'RecursiveQuick': recursiveQuickSort,
    'Quick': quickSort, //visualization is similar to Tree sort
    'RandomQuick': randomQuickSort,
    'LayerQuick': layerQuickSort,
    //'TwoDQuick': twoDQuickSort, this one needs more time to mature
    'Merge': mergeSort,
    //'MergeInsertion': mergeInsertionSort, //TODO
    'radixLSD10': radixLSD10Sort,
    'radixLSD4': radixLSD4Sort,
    'radixLSD2': radixLSD2Sort,
    'radixMSD10': radixMSD10Sort,
    'radixMSD4': radixMSD4Sort,
    'radixMSD2': radixMSD2Sort,
    'Bucket': bucketSort,
    'Counting': countingSort,
    'Spaghetti': spaghettiSort,
    'Gravity': gravitySort,
    'Pancake': pancakeSort,
    'Bogo': bogoSort,
    //'Patience': patienceSort, //TODO
    'Exchange': exchangeSort,
    'ExchangeReverse': exchangeReverseSort,
    'OddEven': oddEvenSort,
    'Circle': circleSort,
    'Tournament': tournamentSort,
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

function* cycleSort(){
    img_dt.set_speed(1/100);
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
    img_dt.set_speed(1/50, 500_000);
    let gap = img_dt.size;
    while(gap > 1){
        gap = Math.floor(gap / 2.3); 
        if(gap == 0) gap = 1;
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

function* gnomeSort(){
    img_dt.set_speed(5, 500_000);
    let index = 0;
    while(index < img_dt.size){
        if(index == 0) index++;
        if(img_dt.get_value(index) >= img_dt.get_value(index - 1)) index++;
        else{
            yield* swap_process(index, index - 1);
            index--;
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
    img_dt.set_speed(1/100, 500_000);
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
    img_dt.set_speed(1/100, 500_000);
    yield* roundMergeSort(img_dt, 0, img_dt.size - 1);
}

function* maxHeapify(img_dt, n, i){
    let largest = i;
    let left = 2 * i + 1;
    let right = 2 * i + 2;
    if(left < n && img_dt.get_value(left) > img_dt.get_value(largest)) largest = left;
    if(right < n && img_dt.get_value(right) > img_dt.get_value(largest)) largest = right;
    if(largest != i){
        yield* swap_process(i, largest);
        yield* maxHeapify(img_dt, n, largest);
    }
}

function* heapSort(){
    img_dt.set_speed(1/50, 500_000);
    for(let i = Math.floor(img_dt.size / 2) - 1; i >= 0; i--){
        yield* maxHeapify(img_dt, img_dt.size, i);
    }
    for(let i = img_dt.size - 1; i > 0; i--){
        yield* swap_process(0, i);
        yield* maxHeapify(img_dt, i, 0);
    }
}

function* radixLSDSort(img_dt, radix){
    const max_digits = Math.ceil(Math.log2(img_dt.size) / Math.log2(radix));
    function get_digit(value, digit){
        return Math.floor(value / Math.pow(radix, digit)) % radix;
    }
    const count = Array(radix).fill(0);
    const output = Array(img_dt.size).fill(0);
    for(let i = 0; i < max_digits; i++){
        count.fill(0);
        for(let j = 0; j < img_dt.size; j++){
            const value = img_dt.get_value(j);
            count[get_digit(value, i)]++;
        }
        const indexes = count.map((c) => 0);
        for(let j = 1; j < radix; j++){
            indexes[j] = indexes[j - 1] + count[j - 1];
        }
        for(let j = 0; j <img_dt.size; j++){
            const value = img_dt.get_value(j);
            const digit = get_digit(value, i);
            output[indexes[digit]] = j;
            indexes[digit]++;
        }
        yield* copy_auxiliar(0, output);
    }
}

function* radixLSD10Sort(){
    img_dt.set_speed(delay, 500_000);
    yield* radixLSDSort(img_dt, 10);
}

function* radixLSD4Sort(){
    img_dt.set_speed(delay, 500_000);
    yield* radixLSDSort(img_dt, 4);
}

function* radixLSD2Sort(){
    img_dt.set_speed(delay, 500_000);
    yield* radixLSDSort(img_dt, 2);
}

function* radixMSDSort(img_dt, radix, left, right, digit){
    if(digit === undefined) digit = Math.ceil(Math.log2(img_dt.size) / Math.log2(radix));
    if(left >= right) return;
    if(isNaN(right)) return;
    if(isNaN(left)) return;
    if(digit < 0) return;
    function get_digit(value, digit){
        return Math.floor(value / Math.pow(radix, digit)) % radix;
    }
    const count = Array(radix).fill(0);
    const output = Array(right - left + 1).fill(0);
    count.fill(0);
    for(let j = left; j <= right; j++){
        const value = img_dt.get_value(j);
        count[get_digit(value, digit)]++;
    }
    let indexes = count.map((c) => 0);
    for(let j = 1; j < radix; j++){
        indexes[j] = indexes[j - 1] + count[j - 1];
    }
    for(let j = left; j <= right; j++){
        const value = img_dt.get_value(j);
        const digit_value = get_digit(value, digit);
        output[indexes[digit_value]] = j;
        indexes[digit_value]++;
    }
    yield* copy_auxiliar(left, output);
    indexes = count.map((c) => 0);
    for(let j = 1; j < radix + 1; j++){
        indexes[j] = indexes[j - 1] + count[j - 1];
    }
    for(let j = 0; j < radix; j++){
        const new_left = left + indexes[j];
        const new_right = left + indexes[j + 1] - 1;
        if(new_left >= new_right) continue;
        yield* radixMSDSort(img_dt, radix, new_left, new_right, digit - 1);
    }
}

function* radixMSD10Sort(){
    img_dt.set_speed(delay, 500_000);
    yield* radixMSDSort(img_dt, 10, 0, img_dt.size - 1);
}

function* radixMSD4Sort(){
    img_dt.set_speed(delay, 500_000);
    yield* radixMSDSort(img_dt, 4, 0, img_dt.size - 1);
}

function* radixMSD2Sort(){
    img_dt.set_speed(delay, 500_000);
    yield* radixMSDSort(img_dt, 2, 0, img_dt.size - 1);
}

function* bucketSort(){
    img_dt.set_speed(delay, 500_000);
    yield* radixMSDSort(img_dt, 40, 0, img_dt.size - 1);
}

function* countingSort(){
    img_dt.set_speed(delay, 500_000);
    yield* radixMSDSort(img_dt, img_dt.size, 0, img_dt.size - 1);
}

function* spaghettiSort(){ //this one is a joke, but works
    img_dt.set_speed(delay, 500_000);
    function hit_the_table(hand){
        return hand == 0
    }
    for(let hand = img_dt.size - 1; !hit_the_table(hand); hand--){
        for(let noddle = 0; noddle < hand; noddle++){
            let noddle_height = img_dt.get_value(noddle);
            if(noddle_height == hand) {
                console.log(hand);
                yield* swap_process(hand, noddle);
                break;
            }
        }
    }
}

function* gravitySort(){ //same as bubble, but different direction, also a joke
    img_dt.set_speed(5, 500_000);
    for(let index1 = 0; index1 < img_dt.size - 1; index1++){
        for(let i = img_dt.size - 1; i > index1; i--){
            if(img_dt.get_value(i) < img_dt.get_value(i - 1)) yield* swap_process(i, i - 1);
        }
    }
}

function* pancakeSort(){ //joke. Same as selection, but you flip pancakes :3
    img_dt.set_speed(5, 500_000);
    function* flip_pancake(index){
        for(let i = 0; i < index - i; i++){
            yield* swap_process(i, index - i);
        }
    }
    for(let index1 = img_dt.size - 1; index1 > 0; index1--){
        let maxIndex = index1;
        let maxValue = img_dt.get_value(index1);
        for(let i = 0; i < index1; i++){
            const value = img_dt.get_value(i);
            if(value > maxValue){
                maxIndex = i;
                maxValue = value;
            }
        }
        //we flip even when the pancake is already in the right position, because it's fun
        yield* flip_pancake(maxIndex);
        yield* flip_pancake(index1);
    }
}

function* bogoSort() {
    img_dt.set_speed(1, 500_000);
    while (!img_dt.is_sorted()) {
        for (let i = 0; i < img_dt.size; i ++) {
            const j = img_dt.random_index();
            yield* swap_process(i,j);
        }
        //limit to one minute LMAO
        if(img_dt.endTime - img_dt.beginTime > 60_000) break;
    }
}

function* exchangeSort(){
    img_dt.set_speed(5, 500_000);
    for(let index1 = 0; index1 < img_dt.size; index1++){
        for(let i = index1 + 1; i < img_dt.size; i++){
            if(img_dt.get_value(i) < img_dt.get_value(index1)) yield* swap_process(i, index1);
        }
    }
}

function* exchangeReverseSort(){
    img_dt.set_speed(5, 500_000);
    for(let index1 = 0; index1 < img_dt.size; index1++){
        for(let i = img_dt.size - 1; i > index1; i--){
            if(img_dt.get_value(i) < img_dt.get_value(index1)) yield* swap_process(i, index1);
        }
    }
}

function* oddEvenSort(){
    let sorted = false;
    while(!sorted){
        sorted = true;
        for(let i = 1; i < img_dt.size - 1; i += 2){
            if(img_dt.get_value(i) > img_dt.get_value(i + 1)){
                yield* swap_process(i, i + 1);
                sorted = false;
            }
        }
        for(let i = 0; i < img_dt.size - 1; i += 2){
            if(img_dt.get_value(i) > img_dt.get_value(i + 1)){
                yield* swap_process(i, i + 1);
                sorted = false;
            }
        }
    }
}

function* circleSort(){
    img_dt.set_speed(1/50, 500_000);
    let sorted = false;
    function* applyCircle(circleSizeStart,index){
        const limit = Math.floor(circleSizeStart/2)
        for(let i = 0; i < limit; i++){
            const index_2 = index + circleSizeStart - i - 1
            if(index_2 > img_dt.size - 1) continue;
            if(img_dt.get_value(index + i) > img_dt.get_value(index_2)){
                sorted = false;
                yield* swap_process(index + i, index_2);
            }
        }
    }
    const maxPower = Math.ceil(Math.log2(img_dt.size));
    while(!sorted){
        sorted = true;
        for(let circlePower = maxPower; circlePower >= 1; circlePower--){
            const circleSize = Math.pow(2, circlePower);
            for(let i = 0; i < img_dt.size; i += circleSize){
                yield* applyCircle(circleSize,i);
            }
        }
    }
}

function* tournamentSort(){
    img_dt.set_speed(5, 500_000);
    let last_winner = undefined; //to save unreachable positions
    function* applyTournament(spacing,limit){
        last_winner = limit;
        let has_print = 0;
        for(let i = 0; i * spacing < limit; i++){
            const index_1 = i * spacing * 2;
            const index_2 = index_1 + spacing;
            if(has_print <= 1){
                has_print++;
            }
            if(index_2 >= limit){
                if(last_winner == limit) last_winner = index_1;
                else if(img_dt.get_value(index_1) < img_dt.get_value(last_winner)) yield* swap_process(index_1, last_winner);
            }
            else if(img_dt.get_value(index_1) < img_dt.get_value(index_2)) yield* swap_process(index_1, index_2);
        }
    } //each round find one winner
    for(let tournament = img_dt.size; tournament > 0; tournament--){
        for(let round = 1; round <= tournament; round *= 2){
            yield* applyTournament(round, tournament);
        }
        yield* swap_process(0, tournament - 1);
    }
}