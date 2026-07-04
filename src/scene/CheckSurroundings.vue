<template>
    <AScene id="checkSurroundings" name="墓地周边">
        <ADialog stop>
            <ALine>
                墓地周围的植被比较茂盛，但打理得还不错，墓穴与墓碑之间点缀着许多高大的灌木和古老的树木。这片墓地显然已经存在好多年了。你看见一名园艺工正在公墓的另一头清理杂草。听见调查员靠近，他转过身并挥手示意。
            </ALine>
            <ALine>
                梅洛迪亚斯·杰弗逊是这片墓地的守墓人，他已在这里工作了二十多年。你决定上前询问。
            </ALine>
            <ACheck
                :target="() => Math.max(Adv.status.Charm, Adv.status.Persuade)"
                target-desc="魅惑/说服检定"
            >
                <template #success>
                    <AGoto tgt="jeff-success" />
                </template>
                <template #fail>
                    <ALine> 这位看守表现得兴致寥寥，并且会说他还有工作要忙，没空站着闲聊。 </ALine>
                    <ALine>你决定孤注一掷。</ALine>
                    <AOptions>
                        <AOption>
                            <template #content>用善意和恭维来争取杰弗逊的配合</template>
                            <ACheck :target="() => Adv.status.Charm" target-desc="魅惑检定">
                                <template #success>
                                    <AGoto tgt="jeff-success" />
                                </template>
                                <template #fail>
                                    <ALine>
                                        杰弗逊大光其火并冲着调查员大叫，要他立刻离开墓地。
                                    </ALine>
                                    <AGoto tgt="ask" />
                                </template>
                            </ACheck>
                        </AOption>
                        <AOption>
                            <template #content>以合理的论证说服对方</template>
                            <ACheck :target="() => Adv.status.Persuade" target-desc="说服检定">
                                <template #success>
                                    <AGoto tgt="jeff-success" />
                                </template>
                                <template #fail>
                                    <ALine>
                                        杰弗逊大光其火并冲着调查员大叫，要他立刻离开墓地。
                                    </ALine>
                                    <AGoto tgt="ask" />
                                </template>
                            </ACheck>
                        </AOption>
                        <AOption>
                            <template #content>沟通时表现得咄咄逼人</template>
                            <ACheck :target="() => Adv.status.Intimidate" target-desc="恐吓检定">
                                <template #success>
                                    <AGoto tgt="jeff-success" />
                                </template>
                                <template #fail>
                                    <ALine>杰弗逊会渐渐恼怒起来并愤然离去；</ALine>
                                    <AGoto tgt="ask" />
                                </template>
                            </ACheck>
                        </AOption>
                        <AOption>
                            <template #content>试图欺骗或愚弄杰弗逊</template>
                            <ACheck :target="() => Adv.status.FastTalk" target-desc="话术检定">
                                <template #success>
                                    <AGoto tgt="jeff-success" />
                                </template>
                                <template #fail>
                                    <ALine>
                                        杰弗逊抄起一把泥土洒向调查员，同时大喊：“滚出去，你这个混蛋！”
                                    </ALine>
                                    <AGoto tgt="ask" />
                                </template>
                            </ACheck>
                        </AOption>
                    </AOptions>
                </template>
            </ACheck>
        </ADialog>
        <ADialog id="jeff-success" stop>
            <ALine>
                他回忆起过去常在墓地看见道格拉斯·金博尔，并且有些想念他，因为那时金博尔经常会花时间陪他聊天。他们两个谈天说地，讨论从天气到政治的各种话题，而杰弗逊很喜欢听金博尔讲那些异国他乡的故事。这位守墓人还会指出道格拉斯·金博尔最喜欢的那块墓碑，就是过去他读书时常坐的那一块。
            </ALine>
            <ARun
                :run="
                    () => {
                        Adv.clue.event.add('金博尔之前常常会花时间与守墓人交谈。');
                        Adv.clue.event.add('金博尔过去常常喜欢坐在一块墓碑上读书。');
                    }
                "
            />
            <ALine>
                杰弗逊和你聊了一会儿，但他看上去急于回去工作。如果问起有没有在墓地见过什么奇怪的事，或是有没有可疑的人在附近游荡，他会停下话头并拒绝透露更多，推辞说是他还有许多活要干，必须马上离开。
            </ALine>
            <ACheck :target="() => Adv.status.Psychology" target-desc="心理学鉴定">
                <template #success>
                    <ALine>你发觉守墓人有所隐瞒，他知道的比他说的更多。</ALine>
                </template>
            </ACheck>
            <ACheck :target="() => Adv.status.SpotHidden" target-desc="侦查检定">
                <template #success>
                    <ALine>
                        你注意到梅洛迪亚斯·杰弗逊的外套口袋微微露出一截瓶子。你认为瓶子里装着酒，这是一个不错的抓手。
                    </ALine>
                    <AOptions>
                        <AOption>
                            <template #content>
                                尝试以此要挟或贿赂这名这位看守，让他提供更多信息。好像和杰弗逊讲道理比直接威胁他更加困难。
                            </template>
                            <ACheck
                                :target="
                                    () => Math.max(Adv.status.Intimidate, Adv.status.Persuade.hard)
                                "
                                target-desc="恐吓【常规】或说服【困难】检定"
                            >
                                <template #success>
                                    <AGoto tgt="jeff-n-success" />
                                </template>
                                <template #fail>
                                    <ALine>但好像没什么作用。</ALine>
                                    <AGoto tgt="ask" />
                                </template>
                            </ACheck>
                        </AOption>
                        <AOption>
                            <template #content>
                                尝试用酒贿赂杰弗逊，尽管禁酒令在美国各州强制推行，这意味着烈酒是违法的。
                            </template>
                            <ACheck :target="() => Adv.status.edu" target-desc="知识检定">
                                <template #success>
                                    <ALine>
                                        你在镇上用2美元买到一品脱（约合0.473升）的烈酒。
                                    </ALine>
                                    <AGoto tgt="jeff-n-success" />
                                </template>
                                <template #fail>
                                    <ALine>你不幸被发现。</ALine>
                                    <ACheck :target="() => Adv.status.luck" target-desc="幸运检定">
                                        <template #success>
                                            <ALine>你逃过一劫</ALine>
                                        </template>
                                        <template #fail>
                                            <ALine>
                                                你整晚都会被关在牢房里，接受严肃训话要求改正行为，并于一天后无罪释放。
                                            </ALine>
                                            <ARun :run="() => Adv.time.advance(60 * 24)" />
                                        </template>
                                    </ACheck>
                                    <AGoto tgt="ask" />
                                </template>
                            </ACheck>
                        </AOption>
                    </AOptions>
                </template>
                <template #fail>
                    <AGoto tgt="ask" />
                </template>
            </ACheck>
        </ADialog>
        <ADialog id="jeff-n-success" next="ask">
            <ALine>
                杰弗逊承认最近深夜还在墓地里见到过人影，就在道格拉斯·金博尔以前常坐的那块墓碑旁，但他因为相信那是金博尔的鬼魂而太过害怕，没敢上前查看。这类事最好别去深究。他言尽于此。
            </ALine>
            <ARun
                :run="
                    () => {
                        Adv.clue.event.add('最近墓地周围仍时常有人影出现。');
                    }
                "
            />
        </ADialog>
    </AScene>
</template>

<script setup lang="ts">
import {
    ACheck,
    ADialog,
    Adv,
    AGoto,
    ALine,
    AOption,
    AOptions,
    ARun,
    AScene,
} from '@advmaker/core';
</script>

<style scoped></style>
