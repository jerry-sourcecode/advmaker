<template>
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
            <ARun :run="() => Adv.time.advance(60)" />
        </ADialog>
    </AScene>
</template>

<script setup lang="ts">
import { ACheck, ADialog, ALine, ARun, AScene, Adv } from '@advmaker/core';
</script>

<style scoped></style>
