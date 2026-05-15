import { createCanvas, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import type { Room, RoomsLayout, Vector2 } from 'sprite-sheet-helper';
import { buildMap, buildNavigationGrid, getMapDimensions, getRooms } from 'sprite-sheet-helper';

const LAYOUTS_DIR = path.resolve(import.meta.dirname, '..', 'src', 'assets', 'layouts');
const SHIPS_DIR = path.resolve(import.meta.dirname, '..', 'src', 'assets', 'ships');

const LAYOUT_SECTION_SIZE = 4;
const MAP_SECTION_SIZE = 40;
const WALL_SIZE = 6;

const MAP_COLORS = {
    floor: '#C8C8C8',
    wall: '#2A2A2A',
    door: '#C8C8C8',
};

// --- helpers ---

function findFilesByExtension(dir: string, exts: string[], recursive = true): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && recursive) {
            files.push(...findFilesByExtension(fullPath, exts, recursive));
        } else if (exts.includes(path.extname(item).toLowerCase())) {
            files.push(fullPath);
        }
    }

    return files;
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function getRoomPosition(room: Room): Vector2 {
    const minX = Math.min(...room.sections.map(s => s.position.x));
    const minY = Math.min(...room.sections.map(s => s.position.y));
    return { x: minX, y: minY };
}

function getRoomSize(room: Room): { width: number; height: number } {
    const minX = Math.min(...room.sections.map(s => s.position.x));
    const minY = Math.min(...room.sections.map(s => s.position.y));
    const maxX = Math.max(...room.sections.map(s => s.position.x));
    const maxY = Math.max(...room.sections.map(s => s.position.y));
    return { width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function writeDataUrlToFile(dataUrl: string, filePath: string): Promise<void> {
    const match = dataUrl.match(/^data:image\/[a-zA-Z]+;base64,(.+)$/);
    if (!match) throw new Error('Invalid data URL format');

    const buffer = Buffer.from(match[1], 'base64');
    const dir = path.dirname(filePath);

    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(filePath, buffer);
}

// --- pass 1: room extraction ---

async function runRoomExtractor(inputPath: string, outputPath: string): Promise<void> {
    const layoutFiles = findFilesByExtension(inputPath, ['.png']);

    for (const filePath of layoutFiles) {
        await processLayout(filePath, outputPath);
    }
}

async function processLayout(imagePath: string, outputPath: string): Promise<void> {
    const img = await loadImage(imagePath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const rooms = getRooms(ctx, LAYOUT_SECTION_SIZE).filter(room => room.color.a > 0);

    const filename = path.basename(imagePath, path.extname(imagePath));
    const dirPath = path.join(outputPath, filename);
    const filePath = path.join(dirPath, `${filename}.rooms.json`);

    await fs.promises.mkdir(dirPath, { recursive: true });

    await writeRoomsToJson(rooms, filePath);

    console.log(`Room data written to: ${filePath}`);
}

async function writeRoomsToJson(rooms: Room[], outputPath: string): Promise<void> {
    const name = path.basename(outputPath, '.rooms.json');

    const jsonData = {
        version: '1.0',
        name,
        layoutSectionSize: LAYOUT_SECTION_SIZE,
        mapSectionSize: MAP_SECTION_SIZE,
        mapSize: {
            width: Math.max(...rooms.flatMap(room => room.sections.map(s => s.position.x))) + 1,
            height: Math.max(...rooms.flatMap(room => room.sections.map(s => s.position.y))) + 1,
        },
        rooms: rooms.map((room, roomIndex) => ({
            index: roomIndex,
            color: rgbToHex(room.color.r, room.color.g, room.color.b),
            position: getRoomPosition(room),
            size: getRoomSize(room),
            sections: room.sections.map((section, index) => ({
                room: roomIndex,
                index,
                position: { x: section.position.x, y: section.position.y },
                doors: section.doors,
            })),
        })),
    };

    fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf-8');
}

// --- pass 2: grid building ---

async function runGridBuilder(inputDir: string, sectionSize: number, outputDir: string): Promise<void> {
    const jsonFiles = findFilesByExtension(inputDir, ['.json']).filter(f => f.includes('.rooms.json'));

    console.log(`Found ${jsonFiles.length} room layout files to process.`);

    for (const filePath of jsonFiles) {
        await processRoomsJsonForGrid(filePath, sectionSize, outputDir);
    }
}

async function processRoomsJsonForGrid(jsonPath: string, sectionSize: number, outputDir: string): Promise<void> {
    try {
        const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
        const roomData: RoomsLayout = JSON.parse(jsonContent);

        const shipGrid = buildNavigationGrid(roomData.rooms, sectionSize);

        let filename = path.basename(jsonPath, path.extname(jsonPath));
        filename = path.basename(filename, '.rooms');

        const dirPath = path.join(outputDir, filename);
        const filePath = path.join(dirPath, `${filename}.grid.json`);

        await fs.promises.mkdir(dirPath, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(shipGrid, null, 2));
    } catch (error) {
        console.error(`Failed to process ${jsonPath}:`, error);
    }
}

// --- pass 3: map building ---

async function runMapBuilder(inputDir: string, outputDir: string): Promise<void> {
    const roomsFiles = findFilesByExtension(inputDir, ['.json']).filter(f => f.includes('.rooms.json'));

    for (const filePath of roomsFiles) {
        await processRoomsJsonForMap(filePath, outputDir);
    }
}

async function processRoomsJsonForMap(jsonPath: string, outputDir: string): Promise<void> {
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const roomData: RoomsLayout = JSON.parse(jsonContent);

    const mapOptions = {
        sectionSize: MAP_SECTION_SIZE,
        wallSize: WALL_SIZE,
        showRoomNumbers: false,
        colors: MAP_COLORS,
    };

    const { width, height } = getMapDimensions(roomData.rooms, mapOptions);
    const shipCanvas = createCanvas(width, height);
    const shipCtx = shipCanvas.getContext('2d');

    buildMap(shipCtx, roomData.rooms, mapOptions);

    const shipCanvasBase64 = shipCanvas.toDataURL();

    let filename = path.basename(jsonPath, path.extname(jsonPath));
    filename = path.basename(filename, '.rooms');

    const dirPath = path.join(outputDir, filename);
    const filePath = path.join(dirPath, `${filename}.map.png`);

    await writeDataUrlToFile(shipCanvasBase64, filePath);
}

// --- main ---

async function main(): Promise<void> {
    console.log('Extracting rooms from layouts...');
    await runRoomExtractor(LAYOUTS_DIR, SHIPS_DIR);

    console.log('Building navigation grids...');
    await runGridBuilder(SHIPS_DIR, 4, SHIPS_DIR);

    console.log('Building maps...');
    await runMapBuilder(SHIPS_DIR, SHIPS_DIR);

    console.log('Done.');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
