<template>
    <AShell>
        <AScene id="main" name="金博尔家">
            <ADialog>
                <ALine>
                    1922年，密歇根市一位名叫托马斯·金博尔的人联系了调查员。他家里似乎遭了贼，被盗的是一些他叔叔最喜欢的书。这个谜团有些不同寻常，因为这位叔叔早在一年前就神秘失踪了，并且没有留下任何踪迹。托马斯·金博尔希望调查员找到偷窃书籍的贼人，尽可能追回这些书籍，并调查他的叔叔道格拉斯·金博尔的去向，以及他是否尚在人世。
                </ALine>
                <ARun
                    :run="
                        () => {
                            Adv.clue.event.add(
                                '任务：找到偷窃书籍的贼人，尽可能追回这些书籍，并调查他的叔叔道格拉斯·金博尔的去向，以及他是否尚在人世。',
                            );
                        }
                    "
                />
                <ALine>
                    因此，他请求调查员调查这起偷书案，同时也看看是否能查明他的叔叔道格拉斯失踪的原因。托马斯·金博尔愿意为这份小小的工作承担各类花销，并会支付整整10美元作为报酬。（大约相当于如今的240美金）
                </ALine>
                <ALine>
                    金博尔先生尚未将这起入室盗窃案上报给警方，因为若干书籍失窃并不足以引起警方的注意，让他们投入各种资源。他向调查员如此描述自己的叔叔：“白发，秃顶，中等身高，戴着圆框眼镜。”托马斯还邀请调查员住进家中的空置的房间，作为调查期间的落脚处。
                </ALine>
                <ARun
                    :run="
                        () => {
                            Adv.char.Douglas.impression.push(
                                '白发，秃顶，中等身高，戴着圆框眼镜。',
                            );
                        }
                    "
                />
            </ADialog>
            <ADialog :next="null" id="ask">
                <ALine>你想去哪里调查？</ALine>
                <AOptions>
                    <AOption next="askResident" :max-times="1">
                        <template #content>询问附近居民</template>
                    </AOption>
                    <AOption next="checkSurroundings" :max-times="1">
                        <template #content>查看墓地周边</template>
                    </AOption>
                    <AOption next="investigateLibrary" :max-times="1">
                        <template #content>在图书馆调查本地消息</template>
                    </AOption>
                    <AOption next="askPolice" :max-times="1">
                        <template #content>询问警方</template>
                    </AOption>
                    <AOption next="checkNewspaper" :max-times="1">
                        <template #content>查阅本地报纸《阿诺兹堡广告报》的旧刊，</template>
                    </AOption>
                    <AOption next="checkAround" :max-times="1">
                        <template #content>查看金博尔家周边</template>
                    </AOption>
                </AOptions>
            </ADialog>
        </AScene>
        <AScene id="askResident" name="附近住宅">
            <ADialog next="ask">
                <ALine>
                    墓地附近的住宅不多；实际上，只有金博尔家离墓地比较近。步行五分钟范围内能找到几所房屋，但邻居们所知甚少，也没有见过任何可疑行迹。如果提起道格拉斯·金博尔的名字，有一位邻居会记得他是个和蔼的人。
                </ALine>
                <ALine>有一名老妇人正好经过。</ALine>
                <ACheck
                    :target="() => Math.max(Adv.status.app, Adv.status.CreditRating)"
                    target-desc="外貌/信用评级检定"
                >
                    <template #success>
                        <ALine>你成功引起了奥黛尔夫人的注意。</ALine>
                        <ALine>
                            奥戴尔夫人会说起她在这里已经住了很久，而且她记得在道格拉斯·金博尔还住在墓地旁边的一栋屋子时见过他。她回忆说，大多数日子里都能看见他胳膊下夹着本书走向墓地。“他总是在读书。”
                            奥戴尔夫人已经有好多年没见过老金博尔了。“他是过世了吗？”说完她补充道，“我认为他侄子继承了这栋房子。”在这简短的对话之后，奥黛尔女士祝福调查员好运，并且走开了。
                        </ALine>
                        <ARun
                            :run="
                                () => {
                                    Adv.clue.event.add(
                                        '大多数日子里都能看见道格拉斯·金博尔胳膊下夹着本书走向墓地，他总是在读书。',
                                    );
                                    Adv.char.Douglas.impression.push('喜欢读书。');
                                }
                            "
                        />
                    </template>
                    <template #fail>
                        <ALine>她不喜欢你的样貌，并且快步离开，避开了你。</ALine>
                    </template>
                </ACheck>
            </ADialog>
        </AScene>
        <AScene id="checkSurroundings" name="墓地周边">
            <ADialog :next="null">
                <ALine>
                    墓地周围的植被比较茂盛，但打理得还不错，墓穴与墓碑之间点缀着许多高大的灌木和古老的树木。这片墓地显然已经存在好多年了。你看见一名园艺工正在公墓的另一头清理杂草。听见调查员靠近，他转过身并挥手示意。
                </ALine>
                <ALine
                    >梅洛迪亚斯·杰弗逊是这片墓地的守墓人，他已在这里工作了二十多年。你决定上前询问。</ALine
                >
                <ACheck
                    :target="() => Math.max(Adv.status.Charm, Adv.status.Persuade)"
                    target-desc="魅惑/说服检定"
                >
                    <template #success>
                        <AGoto tgt="jeff-success" />
                    </template>
                    <template #fail>
                        <ALine>
                            这位看守表现得兴致寥寥，并且会说他还 有工作要忙，没空站着闲聊。
                        </ALine>
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
                                <ACheck
                                    :target="() => Adv.status.Intimidate"
                                    target-desc="恐吓检定"
                                >
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
            <ADialog id="jeff-success">
                <ALine>
                    他回忆起过去常在墓地看见道格拉斯·金博尔，并且有些想念他，因为那时金博尔经常会花时间陪他聊天。他们两个谈天说地，讨论从天气到政治的各种话题，而杰弗逊很喜欢听金博尔讲那些异国他乡的故事。这位守墓人还会指出道格拉斯·金博尔最喜欢的那块墓碑，就是过去他读书时常坐的那一块。
                </ALine>
            </ADialog>
        </AScene>
    </AShell>
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
    AShell,
} from '@advmaker/core';
</script>
