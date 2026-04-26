import type { ADVMaker } from '../api.ts';

export {};
declare global {
    interface Window {
        ADVMaker: typeof ADVMaker;
    }
}
