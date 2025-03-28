# 高级 AI 图像生成提示技巧

## 负面提示技术

负面提示是指定不希望在图像中出现的元素。这对于保持一致性非常重要。

```
负面提示: 模糊, 变形, 不自然的姿势, 额外的四肢, 额外的手指, 畸形的手, 低质量, 像素化, 不协调的背景
```

## 权重调整技术

使用权重调整来强调或弱化某些元素。通常使用括号、冒号或其他符号，具体取决于 AI 平台。

```
一位年轻女子在花园中, (水彩画风格:1.5), (柔和的色彩:1.3), 流动的线条, 轻微的水渍效果
```

## 种子值技术

如果平台支持，使用相同的种子值可以在不同提示之间保持一致的风格和特征。

```
提示: 山间湖泊春季景色, 写实风景油画风格
种子值: 12345
```

## 参考图像技术

一些平台允许上传参考图像，然后生成与之风格一致的新图像。

```
参考图像: [图像ID或URL]
提示: 与参考图像相同的风格, 但场景改为城市街道
```

## 混合风格技术

通过明确指定多种风格的混合比例来创建独特但一致的风格。

```
一位年轻女子肖像, (水彩画风格:0.7) + (日式动漫风格:0.3), 柔和的色彩, 半写实半卡通
```

## 精确色彩控制

使用色彩代码或精确的色彩描述来保持色调一致性。

```
山间湖泊, 主色调:#5B8FB9和#FFB100, 写实风景油画风格
```

## 构图控制技术

明确指定构图元素来保持视觉一致性。

```
山间湖泊, 写实风景油画风格, 黄金分割构图, 前景占1/3, 湖泊占中间1/3, 远山占上方1/3
```

## 多步生成技术

一些平台支持多步生成，先生成基本图像，然后进行细化。

```
步骤1: 山间湖泊基本场景, 写实风景油画风格
步骤2: 增加细节, 提高质量, 保持相同构图和风格
```

## 风格转移技术

指定一个知名艺术家或艺术流派来保持风格一致性。

```
山间湖泊, 以莫奈印象派风格绘制, 柔和的笔触, 光影变化
```

## 提示模板化

创建模板化的提示结构，每次只更改特定部分。

```
模板: [主题], [风格], [色调], [光照], [构图], [细节级别]
实例1: 山间湖泊, 油画风格, 蓝绿色调, 晨光照射, 全景构图, 高细节
实例2: 城市街道, 油画风格, 橙黄色调, 夕阳照射, 全景构图, 高细节
```

## 一致性检查清单

在生成一系列图像前，创建一个一致性检查清单：

1. 风格描述词是否一致？
2. 色彩方案是否统一？
3. 光照条件是否相同？
4. 构图元素是否保持一致？
5. 细节级别是否相同？
6. 负面提示是否一致？
7. 如果适用，种子值是否固定？

## 实际应用示例

### 品牌视觉一致性系列

```
品牌产品在自然环境中, 简约现代风格, 柔和的自然光, 浅景深, 产品居中, 色调:#4A90E2和#FFFFFF, 高质量商业摄影风格, 负面提示:模糊,变形,文字,标志
```

### 游戏角色设计系列

```
游戏角色[名称]的[动作]姿势, 3D渲染风格, 半写实, PBR材质, 中等饱和度, 三点打光, 角色居中特写, 细节丰富的盔甲和武器, 负面提示:低多边形,像素化,比例不当
```
