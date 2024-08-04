function push_if_valid(a, b, img_dt, lens) {
    if (a >= 0 && b >= 0 && a < img_dt.width && b < img_dt.height) lens.push(xy_to_index(a, b, img_dt));
}

function xy_to_index(a, b, img_dt) {
    return a + b * img_dt.width;
}

function compare(color1, index_start, color2) {
    for (let i = 0; i < 3; i++) if (color1[index_start + i] != color2[i]) return false;
    return true;
}

export class Image_data {
    constructor(img_a, ctx_a, lens_type, write_label) {
        this.img = img_a;
        this.ctx = ctx_a;
        const imageData = ctx_a.getImageData(0, 0, img_a.width, img_a.height);
        this.imageData = imageData;
        this.data = imageData.data;
        this.width = img_a.width;
        this.height = img_a.height;
        this.size = img_a.width * img_a.height;
        write_label(img_a.width, "Width", "px");
        write_label(img_a.height, "Height", "px");
        write_label(img_a.width * img_a.height, "Size", "px²");
        this.maxStep = Math.floor(this.size * 1/165);
        this.state = new Array(this.size).fill(0);
        this.lens_type = lens_type;
        this.lens = this.make_lens();
        this.state = this.state.map((a, i) => { return i; });
        this.step = 0;
        this.write_label = write_label;
        this.beginTime = performance.now();
        this.endTime = performance.now();
    }

    set_speed(delay_local, limit) {
        if (limit === undefined) limit = 1000;
        this.maxStep = Math.floor(this.size * delay_local);
        if (this.maxStep < 1) this.maxStep = 1;
        if (this.maxStep > limit) {
            console.log(`Max step overflow : ${this.maxStep}`);
            this.maxStep = limit;
        }
        this.step = 0;
        this.update(); // because set_speed is always called before the animation
    }

    swap_pixels(index1, index2) {
        const index1_img = this.lens[index1] * 4;
        const index2_img = this.lens[index2] * 4;
        for (let j = 0; j < 4; j++) {
            const temp = this.data[index1_img + j];
            this.data[index1_img + j] = this.data[index2_img + j];
            this.data[index2_img + j] = temp;
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

    is_redraw() {
        const test = this.step >= this.maxStep;
        if (test) {
            this.endTime = performance.now();
            this.write_label(((this.endTime - this.beginTime) / 1000).toFixed(3), "Time", "s");
        }
        return test;
    }

    reset_stats() {
        this.reads = 0;
        this.writes = 0;
        this.step = 0;
        this.beginTime = performance.now();
        this.write_label(0, "Time", "s");
    }

    get_value(index) {
        return this.state[index];
    }

    get_color(index) {
        const index_img = this.lens[index] * 4;
        return this.data.slice(index_img, index_img + 3);
    }

    set_color(index, color) {
        const index_img = this.lens[index] * 4;
        for (let i = 0; i < 3; i++) this.data[index_img + i] = color[i];
    }

    make_lens() {
        let lens = new Array(this.size);
        const function_map = {
            "horizontal": horizontal_lens,
            "vertical": vertical_lens,
            "diagonal": diagonal_lens,
            "random": random_lens,
            "ladder": ladder_lens,
            "spiral": spiral_lens,
            "diamond": diamond_lens,
            "color": color_lens,
            "randomExpansion": random_exp_lens,
            "expansion": random_exp_lens
        }
        if (!function_map.hasOwnProperty(this.lens_type)) {
            console.log(`Lens type ${this.lens_type} not found`);
            this.lens_type = "horizontal";
        }
        lens = function_map[this.lens_type](this);
        console.log(lens);
        return lens;
    }
}

function horizontal_lens(img_dt){
    const lens = new Array(img_dt.size);
    for(let i = 0; i < lens.length; i++) lens[i] = i;
    return lens;
}

function vertical_lens(img_dt){
    //TODO fix, it's broken for unknown reasons
    let lens = new Array(img_dt.size);
    const width = img_dt.width;
    const height = img_dt.height;
    let i = 0;
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            lens[i] = xy_to_index(x, y, this);
            i++;
        }
    }
    return lens;
}

function diagonal_lens(img_dt) {
    //TODO: fix for when width < height
    let lens = new Array(img_dt.size);
    const index = img_dt.height <= img_dt.width ? 0 : 1;
    const index_2 = [1,0][index]
    const sizes = [img_dt.width, img_dt.height];
    const size = img_dt.size;
    let coords = [0,0,0]; // x, y, big_x
    for(let i = 0; i < size; i++){
        lens[i] = xy_to_index(coords[0], coords[1], img_dt);
        [0,1].forEach(j => coords[j]++);
        if(coords[index_2] != sizes[index_2]) continue;
        coords[index_2] = 0;
        coords[2]++;
        coords[index] = coords[2];
    }
    return lens;
}

function random_lens(img_dt){
    const size = img_dt.size;
    let lens = new Array(size);
    for (let i = 0; i < size; i++) lens[i] = i;
    for (let i = 0; i < size; i++) {
        const j = Math.floor(Math.random() * size);
        const temp = lens[i];
        lens[i] = lens[j];
        lens[j] = temp;
    }
    return lens;
}

function ladder_lens(img_dt) {
    const size = img_dt.size;
    let x = 0;
    let y = 0;
    let dx = 1;
    let dy = 1;
    const lens = [];
    push_if_valid(x, y, img_dt, lens);
    x++;
    while (lens.length < size) {
        push_if_valid(x, y, img_dt, lens);
        for (let i = 0; i < dy; i++) push_if_valid(x, y + i + 1, img_dt, lens);
        y += dy;
        dy++;
        for (let i = 0; i < dx; i++) push_if_valid(x - i - 1, y, img_dt, lens);
        x = 0;
        dx++;
        y++;
        push_if_valid(x, y, img_dt, lens);
        for (let i = 0; i < dx; i++) push_if_valid(x + i + 1, y, img_dt, lens);
        x += dx;
        dx++;
        for (let i = 0; i < dy; i++) push_if_valid(x, y - i - 1, img_dt, lens);
        dy++;
        y = 0;
        x++;
    }
    return lens;
}

function spiral_lens(img_dt) {
    let x = 0;
    let y = 0;
    let dx = img_dt.width + 1;
    let dy = img_dt.height;
    const size = img_dt.size;
    const lens = [];
    while (lens.length < size) {
        push_if_valid(x, y, img_dt, lens);
        dx -= 2;
        if (dx <= 0) return lens;
        for (let i = 0; i < dx; i++) push_if_valid(x + i + 1, y, img_dt, lens);
        x += dx;
        dy--;
        if (dy <= 0) return lens;
        for (let i = 0; i < dy; i++) push_if_valid(x, y + i + 1, img_dt, lens);
        y += dy;
        if (lens.length >= img_dt.size) return lens;
        for (let i = 0; i < dx; i++) push_if_valid(x - i - 1, y, img_dt, lens);
        x -= dx;
        dy--;
        if (dy <= 0) return lens;
        for (let i = 0; i < dy; i++) push_if_valid(x, y - i - 1, img_dt, lens);
        y -= dy;
        x++;
    }
    return lens;
}

function diamond_lens(img_dt) {
    let x = Math.floor((img_dt.width + 1) / 2);
    let y = Math.floor((img_dt.height + 1) / 2);
    let df = 1;
    const lens = [];
    push_if_valid(x, y, img_dt, lens);
    y++;
    while (lens.length < img_dt.size) {
        for (let i = 0; i < df; i++) push_if_valid(x - i - 1, y - i - 1, img_dt, lens);
        x -= df;
        y -= df;
        for (let i = 0; i < df; i++) push_if_valid(x + i + 1, y - i - 1, img_dt, lens);
        x += df;
        y -= df;
        for (let i = 0; i < df; i++) push_if_valid(x + i + 1, y + i + 1, img_dt, lens);
        x += df;
        y += df;
        for (let i = 0; i < df; i++) push_if_valid(x - i - 1, y + i + 1, img_dt, lens);
        x -= df;
        y += df + 1;
        df++;
    }
    return lens;
}

function color_lens(img_dt) {
    const size = img_dt.size;
    let lens = new Array(size);
    const colors = [];
    for (let i = 0; i < size; i++) lens[i] = i;
    let newLensSize = 0;
    while (newLensSize < size) {
        const color = [];
        let index = lens.shift();
        const value = img_dt.data.slice(4 * index, 4 * (index + 1) - 1);
        color.push(index);
        newLensSize++;
        let aux;
        let index_comp = 0;
        while (index_comp < lens.length) {
            aux = 4 * lens[index_comp];
            if (!compare(img_dt.data, aux, value)) {
                index_comp++;
                continue;
            }
            const index_to_save = lens.splice(index_comp, 1)[0];
            color.push(index_to_save);
            newLensSize++;
        }
        colors.push(color);
    }
    lens = colors.sort((a, b) => b.length - a.length).flat();
    return lens;
}

function random_exp_lens(img_dt) {
    let to_explore = new Set();
    const size = img_dt.size;
    const width = img_dt.width;
    function push_if_possible(index) {
        if (lens.includes(index)) return;
        if (index < 0 || index >= size) return;
        to_explore.add(index);
    }
    if (img_dt.lens_type == "randomExpansion") to_explore.add(Math.floor(Math.random() * size));
    else to_explore.add(0);
    const lens = [];
    while (to_explore.size > 0) {
        let index = Array.from(to_explore)[Math.floor(Math.random() * to_explore.size)];
        lens.push(index);
        to_explore.delete(index);
        if(index % width != 0) push_if_possible(index - 1);
        if(index % width != width - 1) push_if_possible(index + 1);
        push_if_possible(index - width); // up
        push_if_possible(index + width); // down
    }
    return lens;
}