import './main.ts';
import { ADVUserBattle, ADVChoice, ADVUserSkill } from './data/model.ts';
import type { DiceExpression } from './utils/dice.ts';
import AShell from './userComponent/AShell.vue';
import AScene from './userComponent/AScene.vue';
import ADialog from './userComponent/ADialog.vue';
import ALine from './userComponent/ALine.vue';
import AOptions from './userComponent/AOptions.vue';
import AOption from './userComponent/AOption.vue';
import AEnding from './userComponent/AEnding.vue';
import ARun from './userComponent/ARun.vue';
import AIf from './userComponent/AIf.vue';
import AElse from './userComponent/AElse.vue';
import AElif from './userComponent/AElif.vue';
import ACheck from './userComponent/ACheck.vue';
import AGoto from './userComponent/AGoto.vue';
import AEndDialog from './userComponent/AEndDialog.vue';
import ABattle from './userComponent/ABattle.vue';
import APass from './userComponent/APass.vue';
export { Adv } from './api';
export {
    AShell,
    type DiceExpression,
    AScene,
    ALine,
    ADialog,
    AOptions,
    AOption,
    AEnding,
    ADVChoice,
    ARun,
    AIf,
    AElse,
    AElif,
    AGoto,
    ACheck,
    AEndDialog,
    ABattle,
    APass,
    ADVUserBattle,
    ADVUserSkill,
};
