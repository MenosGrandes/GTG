import { readFileSync } from 'node:fs';

try {
    const config = JSON.parse(readFileSync('./project.config.json', 'utf8'));
    const dirs = config.directories;
    console.log(dirs.build);
    console.log(dirs.output.base);
    console.log(dirs.config.base);
} catch {
    console.log('build');
    console.log('output');
    console.log('config');
}
