document.getElementById('imageInput').addEventListener('change', handleImage, false);
document.getElementById('Shuffle').addEventListener('click', () => handleAnimation(shuffleImage), false);
document.getElementById('unShuffle').addEventListener('click', () => handleAnimation(unshuffleImage), false);
document.getElementById('Selection').addEventListener('click', () => handleAnimation(selectionSort), false);
document.getElementById('DoubleSelection').addEventListener('click', () => handleAnimation(doubleSelectionSort), false);
document.getElementById('Insertion').addEventListener('click', () => handleAnimation(insertionSort), false);
document.getElementById('Bubble').addEventListener('click', () => handleAnimation(bubbleSort), false);

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
        this.step = Math.floor(this.size * delay);
        this.state = new Array(this.size).fill(0);
        this.state = this.state.map((a,i) => {return i});
    }

    update_step(delay_local) {
        this.step = Math.floor(this.size * delay_local);
        if(this.step < 1) this.step = 1;
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
    if (img && ctx) return functionToCall();
    console.error('Image not loaded or context not available.');
}

function handleImage(e) {
    const canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
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

function shuffleImage() {
    image_data = new Image_data(img, ctx);
    let index1 = 0;
    function draw() {
        image_data.update();
        if(index1 >= image_data.size) return;
        const limit = Math.min(index1 + image_data.step, image_data.size);
        for (let i = index1; i < limit; i ++) {
            const j = image_data.random_index();
            image_data.swap_pixels(i,j);
            info(`Swapping Pixels ${i} and ${j}`);
        }
        index1 += image_data.step;
        image_data.redraw();
        requestAnimationFrame(draw);
    }
    draw();
}

function unshuffleImage(){
    image_data.update_step(delay);
    let index1 = 0;
    info(`Verificando Pixel ${index1}`);
    function draw() {
        image_data.update();
        if(index1 >= image_data.size) return;
        console.log(image_data.step);
        console.log(image_data.state);
        let numSwaps = 0;
        while(numSwaps < image_data.step){
            if(index1 >= image_data.size) return image_data.redraw();
            if(index1 == image_data.state[index1]){
                index1++;
                info(`Verificando Pixel ${index1}`);
            }
            if(index1 >= image_data.size) return image_data.redraw();
            const index2 = image_data.state[index1];
            console.log(index1, index2);
            image_data.swap_pixels(index1, index2);
            numSwaps++;
        }
        image_data.redraw();
        requestAnimationFrame(draw);
    }
    draw();
}

function selectionSort(){
    image_data.update_step(1/500);
    let index1 = 0;
    info(`Verificando Pixel ${index1}`);
    function draw() {
        image_data.update();
        if(index1 >= image_data.size) return;
        let minIndex = index1;
        for(let j = 0; j < image_data.step; j++){
            for(let i = index1 + 1; i < image_data.size; i++){
                if(image_data.state[i] < image_data.state[minIndex]){
                    minIndex = i;
                }
            }
            image_data.swap_pixels(index1, minIndex);
            index1++;
            info(`Verificando Pixel ${index1}`);
            if(index1 >= image_data.size) return image_data.redraw();
        }
        info(`Verificando Pixel ${index1}`);
        image_data.redraw();
        requestAnimationFrame(draw);
    }
    draw();
}

function doubleSelectionSort(){
    image_data.update_step(1/500);
    let index1 = 0;
    let index2 = image_data.size - 1;
    info(`Verificando Pixel ${index1} and ${index2}`);
    function draw() {
        image_data.update();
        if(index1 >= image_data.size) return;
        let minIndex = index1;
        let maxIndex = index2;
        for(let j = 0; j < image_data.step; j++){
            for(let i = index1 + 1; i < index2 - 1; i++){
                if(image_data.state[i] < image_data.state[minIndex]){
                    minIndex = i;
                }else if(image_data.state[i] > image_data.state[maxIndex]){
                    maxIndex = i;
                }
            }
            image_data.swap_pixels(index1, minIndex);
            image_data.swap_pixels(index2, maxIndex);
            index1++;
            index2--;
            info(`Verificando Pixel ${index1} and ${index2}`);
            if(index1 >= image_data.size/2) return image_data.redraw();
        }
        image_data.redraw();
        requestAnimationFrame(draw);
    }
    draw();
}

function insertionSort(){
    image_data.update_step(25);
    let index1 = 1;
    info(`Verificando Pixel ${image_data.step}`);
    function draw() {
        image_data.update();
        let numSwaps = 0;
        while(numSwaps < image_data.step){
            if(index1 >= image_data.size) return image_data.redraw();
            let index2 = index1;
            while(index2 > 0 && image_data.state[index2] < image_data.state[index2 - 1]){
                image_data.swap_pixels(index2, index2 - 1);
                index2--;
                numSwaps++;
            }
            index1++;
        }
        image_data.redraw();
        requestAnimationFrame(draw);
    }
    draw();
}

//binary insertion is worthless for this case

function bubbleSort(){
    image_data.update_step(1/50);
    let index1 = 0;
    info(`Verificando Pixel ${index1}`);
    function draw() {
        image_data.update();
        if(index1 >= image_data.size) return;
        let numSwaps = 0;
        while(numSwaps < image_data.step){
            if(index1 >= image_data.size) return image_data.redraw();
            for(let i = 0; i < image_data.size - index1 - 1; i++){
                if(image_data.state[i] > image_data.state[i + 1]){
                    image_data.swap_pixels(i, i + 1);
                    numSwaps++;
                }
            }
            index1++;
            info(`Verificando Pixel ${index1}`);
        }
        image_data.redraw();
        requestAnimationFrame(draw);
    }
    draw();
}