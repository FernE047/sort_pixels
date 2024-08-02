//awesome site, save later: https://html.spec.whatwg.org/multipage/canvas.html#canvasrenderingcontext2d

function_map = {
    'Shuffle': shuffle,
    'Partial': partialShuffle,
    'Random': randomShuffle,
    'Half': halfShuffle,
    'Single': singleShuffle,
    'unShuffle': unshuffle,
    'Selection': selectionSort,
    'DoubleSelection': doubleSelectionSort,
    'Insertion': insertionSort,
    'BinaryInsertion': binaryInsertionSort,
    'Bubble': bubbleSort,
    'FasterInsertion': fasterInsertionSort,
    'Shaker': shakerSort,
    'Comb': combSort
}
Object.keys(function_map).forEach(key => document.getElementById(key).addEventListener('click', () => handleAnimation(function_map[key])));

document.getElementById('imageInput').addEventListener('change', handleImage, false);

let img_dt, img, ctx,image_data_needs_update = false;
let delay = 1/165
const labels = {};
["Title","Width","Height","Size","Time"].forEach((label) => labels[label] = document.getElementById(label));

function write_label(text,label_name,measure) {
    if(measure === undefined) measure = "";
    const label = labels[label_name];
    label.innerText = `${label_name}: ${text}${measure}`;
}

function getActivatedPath() {
    const radios = document.getElementsByName('path');
    for (const radio of radios) {
        if (radio.checked) {
            return radio.value;
        }
    }
    return null;
}

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
        write_label(img.width, "Width","px");
        write_label(img.height, "Height","px");
        write_label(img.width * img.height, "Size","px²");
        this.maxStep = Math.floor(this.size * delay);
        this.state = new Array(this.size).fill(0);
        this.path = this.make_path();
        this.state = this.state.map((a,i) => {return i});
        this.step = 0;
        this.writes = 0;
        this.beginTime = performance.now();
        this.endTime = performance.now();
    }

    set_speed(delay_local,limit) {
        if(limit === undefined) limit = 1000;
        this.maxStep = Math.floor(this.size * delay_local);
        if(this.maxStep < 1) this.maxStep = 1;
        if(this.maxStep > limit){
            console.log(`Max step overflow : ${this.maxStep}`);
            this.maxStep = limit;
        }
        this.step = 0;
        this.update(); // because set_speed is always called before the animation
    }
    
    swap_pixels(index1, index2) {
        const index1_img = this.path[index1] * 4;
        const index2_img = this.path[index2] * 4;
        for (let j = 0; j < 4; j++){
            const temp = this.data[index1_img+j];
            this.data[index1_img+j] = this.data[index2_img+j];
            this.data[index2_img+j] = temp;
        }
        const temp = this.state[index1];
        this.state[index1] = this.state[index2];
        this.state[index2] = temp;
        this.step += 2;
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

    is_redraw(){
        const test = this.step >= this.maxStep;
        if(test){
            this.endTime = performance.now();
            write_label(((this.endTime - this.beginTime)/1000).toFixed(3), "Time","s");
        }
        return test;
    }

    reset_stats(){
        this.reads = 0;
        this.writes = 0;
        this.step = 0;
        this.beginTime = performance.now();
        write_label(0, "Time","s");
    }

    get_value(index){
        return this.state[index];
    }

    make_path(){
        let path = new Array(this.size);
        const path_type = getActivatedPath();
        switch(path_type){
            case "horizontal":{
                for(let i = 0; i < this.size; i++) path[i] = i;
                break;
            }
            case "vertical":{
                let i = 0;
                for(let x = 0; x < this.width; x++){
                    for(let y = 0; y < this.height; y++){
                        path[i] = xy_to_index(x,y,this);
                        i++;
                    }
                }
                break;
            }
            case "diagonal":{
                let i = 0;
                let x = 0;
                let y = 0;
                let big_x = 0;
                while(i < this.size){
                    path[i] = xy_to_index(x,y,this);
                    i++;
                    x++;
                    y++;
                    if(this.height < this.width){
                        if(y == this.height){
                            y = 0;
                        }
                        if(x == this.width){
                            x = 0;
                            big_x++;
                            y = big_x;
                        }
                    }else{
                        if(x == this.width){
                            x = 0;
                        }
                        if(y == this.height){
                            y = 0;
                            big_x++;
                            x = big_x;
                        }
                    }
                }
                break;
            }
            case "random":{
                for(let i = 0; i < this.size; i++) path[i] = i;
                for(let i = 0; i < this.size; i++){
                    const j = Math.floor(Math.random() * this.size);
                    const temp = path[i];
                    path[i] = path[j];
                    path[j] = temp;
                }
                break;
            }
            case "ladder":{
                let max = Math.max(this.width,this.height);
                max += 1 - (max % 2); // ensures that max is odd
                let x = 0;
                let y = 0;
                let dx = 1;
                let dy = 1;
                path = [];
                push_if_valid(x, y, this);
                x++;
                while(path.length < this.size){
                    console.log(path);
                    push_if_valid(x, y, this);
                    for(let i = 0; i < dy; i++) push_if_valid(x, y + i + 1, this);
                    y += dy;
                    dy++;
                    for(let i = 0; i < dx; i++) push_if_valid(x - i - 1, y, this);
                    x = 0;
                    dx++;
                    y++;
                    push_if_valid(x, y, this);
                    for(let i = 0; i < dx; i++) push_if_valid(x + i + 1, y, this);
                    x += dx;
                    dx++;
                    for(let i = 0; i < dy; i++) push_if_valid(x, y - i - 1, this);
                    dy++;
                    y = 0;
                    x++;
                }
                break;
            }
            case "spiral":{
                let x = 0;
                let y = 0;
                let dx = this.width + 1;
                let dy = this.height;
                path = [];
                console.log(path);
                while(path.length < this.size){
                    console.log(path);
                    push_if_valid(x, y, this);
                    dx-=2;
                    if(dx <= 0) return path;
                    for(let i = 0; i < dx; i++) push_if_valid(x + i + 1, y, this);
                    x += dx;
                    dy--;
                    if(dy <= 0) return path;
                    for(let i = 0; i < dy; i++) push_if_valid(x, y + i + 1, this);
                    y += dy;
                    if(path.length >= this.size) return path;
                    for(let i = 0; i < dx; i++) push_if_valid(x - i - 1, y, this);
                    x -= dx;
                    dy--;
                    if(dy <= 0) return path;
                    for(let i = 0; i < dy; i++) push_if_valid(x, y - i - 1, this);
                    y -= dy;
                    x++;
                }
                console.log(path);
                break;
            }
            case "diamond":{
                let x = Math.floor((this.width + 1) / 2);
                let y = Math.floor((this.height + 1) / 2);
                let df = 1;
                path = [];
                push_if_valid(x, y, this);
                y++;
                while(path.length < this.size){
                    console.log(x,y);
                    for(let i = 0; i < df; i++) push_if_valid(x - i - 1, y - i - 1, this);
                    x -= df;
                    y -= df;
                    console.log(x,y);
                    for(let i = 0; i < df; i++) push_if_valid(x + i + 1, y - i - 1, this);
                    x += df;
                    y -= df;
                    console.log(x,y);
                    for(let i = 0; i < df; i++) push_if_valid(x + i + 1, y + i + 1, this);
                    x += df;
                    y += df;
                    console.log(x,y);
                    for(let i = 0; i < df; i++) push_if_valid(x - i - 1, y + i + 1, this);
                    x -= df;
                    y += df + 1;
                    console.log(x,y);
                    df++;
                }
                break;
            }
            case "color":{
                function compare(color1, index_start, color2){
                    for(let i = 0; i < 3; i++) if(color1[index_start + i] != color2[i]) return false;
                    return true;
                }
                for(let i = 0; i < this.size; i++) path[i] = i;
                let newPathSize = 0;
                const colors = [];
                while(newPathSize < this.size){
                    const color = [];
                    let index = path.shift();
                    const value = this.data.slice(4*index, 4*(index + 1)-1);
                    color.push(index);
                    newPathSize++;
                    let aux;
                    let index_comp = 0;
                    while(index_comp < path.length){
                        aux = 4*path[index_comp];
                        if(!compare(this.data, aux, value)){
                            index_comp++;
                            continue;
                        }
                        const index_to_save = path.splice(index_comp,1)[0];
                        color.push(index_to_save);
                        newPathSize++;
                    }
                    colors.push(color);
                }
                path = colors.sort((a,b) => b.length - a.length).flat();
            }
        }
        console.log(path);
        return path;
        function push_if_valid(a,b,img_dt){
            if(a >= 0 && b >= 0 && a < img_dt.width && b < img_dt.height) path.push(xy_to_index(a,b,img_dt));
        }
        function xy_to_index(a,b,img_dt){
            return a + b * img_dt.width;
        }
    }
}

function handlePathChange(){
    image_data_needs_update = true;
}

function handleAnimation(functionToCall) {
    if (!img || !ctx) return console.error('Image not loaded or context not available.');

    const functionSort = functionToCall();
    
    if(image_data_needs_update) {
        img_dt = new Image_data(img, ctx);
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

function* shuffle() {
    img_dt.update();
    for (let i = 0; i < img_dt.size; i ++) {
        const j = img_dt.random_index();
        yield* swap_process(i,j);
    }
}

function* partialShuffle(){
    img_dt.update();
    const min_lim = Math.floor(img_dt.size * 0.2);
    const max_lim = Math.floor(img_dt.size * 0.4);
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

function* fasterInsertionSort(){ //only works with horizontal path
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