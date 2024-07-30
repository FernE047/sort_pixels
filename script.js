//awesome site, save later: https://html.spec.whatwg.org/multipage/canvas.html#canvasrenderingcontext2d

function_map ={
    'Shuffle': shuffleImage,
    'unShuffle': unshuffleImage,
    'Selection': selectionSort,
    'DoubleSelection': doubleSelectionSort,
    'Insertion': insertionSort,
    'BinaryInsertion': binaryInsertionSort,
    'Bubble': bubbleSort,
    'Shaker': shakerSort,
    'Comb': combSort
}
Object.keys(function_map).forEach(key => document.getElementById(key).addEventListener('click', () => handleAnimation(function_map[key])));

document.getElementById('imageInput').addEventListener('change', handleImage, false);

let image_data, img, ctx;
let delay = 1/165
const label = document.getElementById('info');

class Image_data {
    constructor(img_a, ctx_a) {
        this.img = img_a;
        this.ctx = ctx_a;
        const imageData = ctx_a.getImageData(0, 0, img_a.width, img_a.height);
        this.imageData = imageData;
        this.data = imageData.data;
        this.width = img_a.width;
        this.height = img_a.height;
        this.size = img_a.width * img_a.height;
        this.sizex4 = this.size * 4;
        this.maxStep = Math.floor(this.size * delay);
        this.state = new Array(this.size).fill(0);
        this.state = this.state.map((a,i) => {return i});
        this.step = 0;
    }

    update_step(delay_local,limit) {
        if(limit === undefined) limit = 1000;
        this.maxStep = Math.floor(this.size * delay_local);
        if(this.maxStep < 1) this.maxStep = 1;
        if(this.maxStep > limit){
            console.log(`Max step overflow : ${this.maxStep}`);
            this.maxStep = limit;
        }
        this.step = 0;
    }

    swap_state(index1, index2) {
        const temp = this.state[index1];
        this.state[index1] = this.state[index2];
        this.state[index2] = temp;
    }
    
    swap_pixels_channel(index1, index2) {
        const temp = this.data[index1];
        this.data[index1] = this.data[index2];
        this.data[index2] = temp;
    }
    
    swap_pixels(index1, index2) {
        const index4x1 = index1 * 4;
        const index4x2 = index2 * 4;
        for (let j = 0; j < 4; j++) this.swap_pixels_channel(index4x1 + j, index4x2 + j);
        this.swap_state(index1, index2);
    }
    
    random_index() {
        return Math.floor(Math.random() * this.size);
    }
    
    redraw() {
        this.ctx.putImageData(this.imageData, 0, 0);
    }

    update() {
        this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        this.data = this.imageData.data;
        this.step = 0;
    }

    countSwap(){
        this.step++;
    }

    is_redraw(){
        return this.step >= this.maxStep;
    }

    insert(index1, index2){
        const index4x1 = index1;
        const index4x2 = index2;
        for (let j = index4x1; j > index4x2; j--) this.swap_pixels(j, j+1);
    }
}

function info(text) {
    label.innerText = text;
}

function handleAnimation(functionToCall) {
    if (!img || !ctx) return console.error('Image not loaded or context not available.');

    const functionSort = functionToCall();

    function draw() {
        if (!functionSort.next().done) {
            image_data.redraw();
            requestAnimationFrame(draw); // Schedule the next step
        }
        image_data.redraw();
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
    }
    
    reader.readAsDataURL(e.target.files[0]);
}

function* handleRedraw(image_data) {
    image_data.countSwap();
    if (image_data.is_redraw()) {
        yield; // Pause and save the current state
        image_data.update();
    }
}

function* shuffleImage() {
    image_data = new Image_data(img, ctx);
    let index1 = 0;
    image_data.update();
    for (let i = index1; i < image_data.size; i ++) {
        const j = image_data.random_index();
        image_data.swap_pixels(i,j);
        info(`Swapping Pixels ${i} and ${j}`);
        yield* handleRedraw(image_data);
    }
    index1 += image_data.step;
}

function* unshuffleImage(){
    image_data.update_step(delay);
    let index1 = 0;
    info(`Verificando Pixel ${index1}`);
    image_data.update();
    while(index1 < image_data.size){
        if(index1 == image_data.state[index1]){
            index1++;
            info(`Verificando Pixel ${index1}`);
            yield* handleRedraw(image_data);
        }else{
            const index2 = image_data.state[index1];
            image_data.swap_pixels(index1, index2);
            yield* handleRedraw(image_data);
        }
    }
}

function* selectionSort(){
    image_data.update_step(delay);
    image_data.update();
    for(let index1 = 0; index1 < image_data.size; index1++){
        info(`Verificando Pixel ${index1}`);
        let minIndex = index1;
        for(let i = index1 + 1; i < image_data.size; i++){
            if(image_data.state[i] < image_data.state[minIndex]){
                minIndex = i;
            }
        }
        image_data.swap_pixels(index1, minIndex);
        yield* handleRedraw(image_data);
    }
}

function* doubleSelectionSort(){
    image_data.update_step(delay);
    image_data.update();
    for(let index1 = 0; index1 < image_data.size/2; index1++){
        let index2 = image_data.size - index1 - 1;
        info(`Verificando Pixel ${index1} and ${index2}`);
        let minIndex = index1;
        let maxIndex = index2;
        for(let i = index1 + 1; i < index2 - 1; i++){
            if(image_data.state[i] < image_data.state[minIndex]){
                minIndex = i;
            }else if(image_data.state[i] > image_data.state[maxIndex]){
                maxIndex = i;
            }
        }
        image_data.swap_pixels(index1, minIndex);
        yield* handleRedraw(image_data);
        image_data.swap_pixels(index2, maxIndex);
        yield* handleRedraw(image_data);
    }
}

function* insertionSort(){
    image_data.update_step(15,500_000);
    image_data.update();
    for(let index1 = 1; index1 < image_data.size; index1++){
        info(`Verificando Pixel ${index1}`);
        let place_to_insert = index1;
        while(place_to_insert > 0 && image_data.state[index1] < image_data.state[place_to_insert - 1]){
            place_to_insert--;
        }
        while(place_to_insert < index1){
            image_data.swap_pixels(place_to_insert, index1);
            yield* handleRedraw(image_data);
            place_to_insert++;
        }
    }
}

function* binaryInsertionSort(){
    image_data.update_step(15,500_000);
    image_data.update();
    for(let index1 = 1; index1 < image_data.size; index1++){
        info(`Verificando Pixel ${index1}`);
        let left = 0;
        let right = index1;
        while(left < right){
            const middle = Math.floor((left + right) / 2);
            if(image_data.state[index1] < image_data.state[middle]){
                right = middle;
            }else{
                left = middle + 1;
            }
        }
        for(let i = left; i < index1; i++){
            image_data.swap_pixels(i, index1);
            yield* handleRedraw(image_data);
        }
    }
}

function* bubbleSort(){
    image_data.update_step(5, 500_000);
    image_data.update();
    for(let index1 = 0; index1 < image_data.size - 1; index1++){
        info(`Verificando Pixel ${index1}`);
        for(let i = 0; i < image_data.size - index1 - 1; i++){
            if(image_data.state[i] > image_data.state[i + 1]){
                image_data.swap_pixels(i, i + 1);
                yield* handleRedraw(image_data);
            }
        }
    }
}

function* shakerSort(){
    image_data.update_step(5, 500_000);
    image_data.update();

    for(let index1 = 0; index1 < image_data.size - 1; index1++){
        info(`Verificando Pixel ${index1}`);
        let numSwaps = 0;
        for(let i = 0; i < image_data.size - index1 - 1; i++){
            if(image_data.state[i] > image_data.state[i + 1]){
                image_data.swap_pixels(i, i + 1);
                numSwaps++;
                yield* handleRedraw(image_data);
            }
        }
        for(let i = image_data.size - index1 - 1; i > 0; i--){
            if(image_data.state[i] < image_data.state[i - 1]){
                image_data.swap_pixels(i, i - 1);
                numSwaps++;
                yield* handleRedraw(image_data);
            }
        }
        if(numSwaps == 0) return info("Array is sorted");
    }
}

function* combSort(){
    image_data.update_step(delay, 500_000);
    image_data.update();
    let gap = image_data.size;
    let numSwaps = 0;
    while(!(gap == 1 && numSwaps == 0)){
        numSwaps = 0;
        for(let index1 = 0; index1 < image_data.size - gap; index1++){
            info(`Verificando Pixel ${index1}`);
            const index2 = index1 + gap;
            if(image_data.state[index1] > image_data.state[index2]){
                image_data.swap_pixels(index1, index2);
                numSwaps++;
                yield* handleRedraw(image_data);
            }
        }
        if(gap!=1){
            gap = Math.floor(gap / 1.3);
            console.log(gap);
        }
    }
}