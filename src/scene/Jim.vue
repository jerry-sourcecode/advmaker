<template>
    <AScene id="main" name="金博尔家">
        <ADialog>
            <ALine>
                1922年，密歇根市一位名叫托马斯·金博尔的人联系了调查员。他家里似乎遭了贼，被盗的是一些他叔叔最喜欢的书。这个谜团有些不同寻常，因为这位叔叔早在一年前就神秘失踪了，并且没有留下任何踪迹。托马斯·金博尔希望调查员找到偷窃书籍的贼人，尽可能追回这些书籍，并调查他的叔叔道格拉斯·金博尔的去向，以及他是否尚在人世。
            </ALine>
            <ARun
                :run="
                    () => {
                        Adv.clue.event.add(
                            '任务：找到偷窃书籍的贼人，尽可能追回这些书籍，并调查道格拉斯·金博尔的去向，以及他是否尚在人世。',
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
                        Adv.char.Douglas.impression.push('白发，秃顶，中等身高，戴着圆框眼镜。');
                    }
                "
            />
        </ADialog>
        <ADialog stop id="ask">
            <ARun :run="() => Adv.time.advance(10)" />
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
</template>

<script setup lang="ts">
import { ADialog, Adv, ALine, AOption, AOptions, ARun, AScene } from '@advmaker/core';
</script>
