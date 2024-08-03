function push_if_valid(a, b, img_dt) {
    if (a >= 0 && b >= 0 && a < img_dt.width && b < img_dt.height) path.push(xy_to_index(a, b, img_dt));
}

function xy_to_index(a, b, img_dt) {
    return a + b * img_dt.width;
}

function compare(color1, index_start, color2) {
    for (let i = 0; i < 3; i++) if (color1[index_start + i] != color2[i]) return false;
    return true;
}

export class Image_data {
    constructor(img_a, ctx_a, path_type, write_label) {
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
        this.path_type = path_type;
        this.path = this.make_path();
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
        const index1_img = this.path[index1] * 4;
        const index2_img = this.path[index2] * 4;
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

    make_path() {
        let path = new Array(this.size);
        const function_map = {
            "horizontal": horizontal_path,
            "vertical": vertical_path,
            "diagonal": diagonal_path,
            "random": random_path,
            "ladder": ladder_path,
            "spiral": spiral_path,
            "diamond": diamond_path,
            "color": color_path,
            "randomExpansion": random_exp_path,
            "expansion": random_exp_path
        }
        if (!function_map.hasOwnProperty(this.path_type)) {
            console.log(`Path type ${this.path_type} not found`);
            this.path_type = "horizontal";
        }
        path = function_map[this.path_type](this);
        console.log(path);
        return path;
    }
}

function horizontal_path(img_dt){
    const path = new Array(img_dt.size);
    for(let i = 0; i < path.length; i++) path[i] = i;
    return path;
}

function vertical_path(img_dt){
    let path = new Array(img_dt.size);
    const width = img_dt.width;
    const height = img_dt.height;
    let i = 0;
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            path[i] = xy_to_index(x, y, this);
            i++;
        }
    }
    return path;
}

function diagonal_path(img_dt) {
    let path = new Array(img_dt.size);
    const index = img_dt.height <= img_dt.width ? 0 : 1;
    const index_2 = [1,0][index]
    const sizes = [img_dt.width, img_dt.height];
    const size = img_dt.size;
    let coords = [0,0,0]; // x, y, big_x
    for(let i = 0; i < size; i++){
        path[i] = xy_to_index(coords[0], coords[1], img_dt);
        [0,1].forEach(j => coords[j]++);
        if(coords[index_2] != sizes[index_2]) continue;
        coords[index_2] = 0;
        coords[2]++;
        coords[index] = coords[2];
    }
    return path;
}

function random_path(img_dt){
    const size = img_dt.size;
    let path = new Array(size);
    for (let i = 0; i < size; i++) path[i] = i;
    for (let i = 0; i < size; i++) {
        const j = Math.floor(Math.random() * size);
        const temp = path[i];
        path[i] = path[j];
        path[j] = temp;
    }
    return path;
}

function ladder_path(img_dt) {
    const size = img_dt.size;
    let x = 0;
    let y = 0;
    let dx = 1;
    let dy = 1;
    const path = [];
    push_if_valid(x, y, img_dt);
    x++;
    while (path.length < size) {
        push_if_valid(x, y, img_dt);
        for (let i = 0; i < dy; i++) push_if_valid(x, y + i + 1, img_dt);
        y += dy;
        dy++;
        for (let i = 0; i < dx; i++) push_if_valid(x - i - 1, y, img_dt);
        x = 0;
        dx++;
        y++;
        push_if_valid(x, y, img_dt);
        for (let i = 0; i < dx; i++) push_if_valid(x + i + 1, y, img_dt);
        x += dx;
        dx++;
        for (let i = 0; i < dy; i++) push_if_valid(x, y - i - 1, img_dt);
        dy++;
        y = 0;
        x++;
    }
    return path;
}

function spiral_path(img_dt) {
    let x = 0;
    let y = 0;
    let dx = img_dt.width + 1;
    let dy = img_dt.height;
    const size = img_dt.size;
    const path = [];
    while (path.length < size) {
        push_if_valid(x, y, img_dt);
        dx -= 2;
        if (dx <= 0) return path;
        for (let i = 0; i < dx; i++) push_if_valid(x + i + 1, y, img_dt);
        x += dx;
        dy--;
        if (dy <= 0) return path;
        for (let i = 0; i < dy; i++) push_if_valid(x, y + i + 1, img_dt);
        y += dy;
        if (path.length >= img_dt.size) return path;
        for (let i = 0; i < dx; i++) push_if_valid(x - i - 1, y, img_dt);
        x -= dx;
        dy--;
        if (dy <= 0) return path;
        for (let i = 0; i < dy; i++) push_if_valid(x, y - i - 1, img_dt);
        y -= dy;
        x++;
    }
    return path;
}

function diamond_path(img_dt) {
    let x = Math.floor((img_dt.width + 1) / 2);
    let y = Math.floor((img_dt.height + 1) / 2);
    let df = 1;
    const path = [];
    push_if_valid(x, y, img_dt);
    y++;
    while (path.length < img_dt.size) {
        for (let i = 0; i < df; i++) push_if_valid(x - i - 1, y - i - 1, img_dt);
        x -= df;
        y -= df;
        for (let i = 0; i < df; i++) push_if_valid(x + i + 1, y - i - 1, img_dt);
        x += df;
        y -= df;
        for (let i = 0; i < df; i++) push_if_valid(x + i + 1, y + i + 1, img_dt);
        x += df;
        y += df;
        for (let i = 0; i < df; i++) push_if_valid(x - i - 1, y + i + 1, img_dt);
        x -= df;
        y += df + 1;
        df++;
    }
    return path;
}

function color_path(img_dt) {
    const size = img_dt.size;
    let path = new Array(size);
    const colors = [];
    for (let i = 0; i < size; i++) path[i] = i;
    let newPathSize = 0;
    while (newPathSize < size) {
        const color = [];
        let index = path.shift();
        const value = img_dt.data.slice(4 * index, 4 * (index + 1) - 1);
        color.push(index);
        newPathSize++;
        let aux;
        let index_comp = 0;
        while (index_comp < path.length) {
            aux = 4 * path[index_comp];
            if (!compare(img_dt.data, aux, value)) {
                index_comp++;
                continue;
            }
            const index_to_save = path.splice(index_comp, 1)[0];
            color.push(index_to_save);
            newPathSize++;
        }
        colors.push(color);
    }
    path = colors.sort((a, b) => b.length - a.length).flat();
    return path;
}

function random_exp_path(img_dt) {
    let to_explore = new Set();
    const size = img_dt.size;
    const width = img_dt.width;
    function push_if_possible(index) {
        if (path.includes(index)) return;
        if (index < 0 || index >= size) return;
        to_explore.add(index);
    }
    if (img_dt.path_type == "randomExpansion") to_explore.add(Math.floor(Math.random() * size));
    else to_explore.add(0);
    const path = [];
    while (to_explore.size > 0) {
        let index = Array.from(to_explore)[Math.floor(Math.random() * to_explore.size)];
        path.push(index);
        to_explore.delete(index);
        if(index % width != 0) push_if_possible(index - 1);
        if(index % width != width - 1) push_if_possible(index + 1);
        push_if_possible(index - width); // up
        push_if_possible(index + width); // down
    }
    return path;
}