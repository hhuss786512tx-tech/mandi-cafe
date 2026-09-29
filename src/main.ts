import './styles/main.css';
import { mountStatus } from './lib/hours';
import { mountHeader } from './lib/header';
import { mountMap } from './lib/map';
import { mountLightbox } from './lib/lightbox';
import { mountTilt } from './lib/tilt';
import { mountMotion } from './lib/motion';
import { scheduleScene } from './scene';

mountStatus();
mountHeader();
mountMap();
mountLightbox();
mountTilt();
mountMotion();
scheduleScene();

document.querySelector('[data-print]')?.addEventListener('click', () => window.print());
