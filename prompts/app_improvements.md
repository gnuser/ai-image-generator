# OpenAI 图像生成器应用改进建议

## 当前问题

根据错误日志，应用程序遇到了"Country, region, or territory not supported"错误，这表明您所在的地区不被 OpenAI 的 DALL-E 3 API 支持。

```
Error generating image: PermissionDeniedError: 403 Country, region, or territory not supported
```

## 解决方案建议

### 1. 添加替代 AI 图像生成服务支持

修改应用程序以支持多种 AI 图像生成服务，而不仅仅依赖于 OpenAI 的 DALL-E。

#### 可考虑的替代服务：

- **Stability AI** (Stable Diffusion API)
- **Midjourney API** (如果可用)
- **Leonardo.ai**
- **Replicate.com** (提供多种开源模型 API)

### 2. 实现本地 Stable Diffusion 部署

为了完全避免区域限制，可以考虑添加本地 Stable Diffusion 模型支持：

1. 使用[ComfyUI](https://github.com/comfyanonymous/ComfyUI)或[AUTOMATIC1111 WebUI](https://github.com/AUTOMATIC1111/stable-diffusion-webui)作为后端
2. 通过 API 与本地部署的模型通信
3. 保留现有的用户界面和风格预设功能

### 3. 服务选择器功能

在应用程序中添加服务选择器，允许用户选择使用哪种 AI 图像生成服务：

```jsx
<div className="form-control">
  <label className="label">
    <span className="label-text">AI服务提供商</span>
  </label>
  <select className="select select-bordered" {...register("provider")}>
    <option value="openai">OpenAI DALL-E 3</option>
    <option value="stability">Stability AI</option>
    <option value="replicate">Replicate.com</option>
    <option value="local">本地Stable Diffusion</option>
  </select>
</div>
```

### 4. API 适配器实现

创建一个适配器层来处理不同 API 的差异：

```typescript
// app/services/imageGenerationService.ts

interface ImageGenerationOptions {
  prompt: string;
  size: string;
  provider: string;
  // 其他通用选项
}

async function generateImage(options: ImageGenerationOptions): Promise<string> {
  switch (options.provider) {
    case "openai":
      return generateWithOpenAI(options);
    case "stability":
      return generateWithStabilityAI(options);
    case "replicate":
      return generateWithReplicate(options);
    case "local":
      return generateWithLocalSD(options);
    default:
      throw new Error("Unsupported provider");
  }
}
```

### 5. 高级提示功能增强

增强现有的风格预设功能，实现更复杂的提示策略：

- 添加负面提示支持
- 实现提示权重调整
- 添加种子值控制（适用于 Stable Diffusion 等）
- 支持参考图像上传

### 6. 本地代理服务器

如果您希望继续使用 OpenAI API，可以考虑实现一个部署在支持地区的代理服务器：

1. 在支持的地区部署一个简单的代理服务器
2. 将应用程序的请求转发到该代理服务器
3. 代理服务器调用 OpenAI API 并返回结果

## 实施计划

1. **短期解决方案**：实现 Replicate.com API 支持，因为它提供了多种模型选择
2. **中期解决方案**：添加本地 Stable Diffusion 支持
3. **长期解决方案**：实现完整的多服务提供商架构

## 代码修改示例

### API 路由修改

```typescript
// app/api/generate-image/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Replicate } from "replicate";

// 初始化API客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
  try {
    // 解析请求体
    const body = await request.json();
    const { prompt, size = "1024x1024", provider = "replicate" } = body;

    // 验证请求
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    let imageUrl;

    // 根据提供商选择不同的API
    switch (provider) {
      case "openai":
        // 验证尺寸参数
        const validSizes = ["1024x1024", "1024x1792", "1792x1024"];
        if (!validSizes.includes(size)) {
          return NextResponse.json(
            {
              error:
                "Invalid size parameter for OpenAI. Must be one of: 1024x1024, 1024x1792, 1792x1024",
            },
            { status: 400 }
          );
        }

        // 调用OpenAI API生成图像
        const openaiResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt,
          n: 1,
          size: size as "1024x1024" | "1024x1792" | "1792x1024",
        });

        imageUrl = openaiResponse.data[0].url;
        break;

      case "replicate":
        // 使用Replicate的Stable Diffusion模型
        const replicateOutput = await replicate.run(
          "stability-ai/sdxl:c221b2b8ef527988fb59bf24a8b97c4561f1c671f73bd389f866bfb27c061316",
          {
            input: {
              prompt,
              width: size.split("x")[0],
              height: size.split("x")[1],
              num_outputs: 1,
            },
          }
        );

        imageUrl = Array.isArray(replicateOutput) ? replicateOutput[0] : "";
        break;

      default:
        return NextResponse.json(
          { error: "Unsupported provider" },
          { status: 400 }
        );
    }

    // 返回图像URL
    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error("Error generating image:", error);

    // 处理API错误
    if (error.response) {
      return NextResponse.json(
        { error: error.response.data?.error?.message || "Error from API" },
        { status: error.response.status }
      );
    }

    // 处理其他错误
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
```

### 前端组件修改

```tsx
// app/components/ImageGenerator.tsx (部分修改)

// 添加提供商选择
const { register, handleSubmit, watch, setValue } = useForm<FormData>({
  defaultValues: {
    prompt: "",
    size: "1024x1024",
    provider: "replicate", // 默认使用Replicate
    negativePrompt: "",
    seed: "",
  },
});

// 在表单中添加提供商选择
<div className="form-control">
  <label className="label">
    <span className="label-text">AI服务提供商</span>
  </label>
  <select className="select select-bordered" {...register("provider")}>
    <option value="replicate">Replicate (Stable Diffusion XL)</option>
    <option value="openai">OpenAI DALL-E 3 (可能受区域限制)</option>
  </select>
</div>;

// 添加高级选项
{
  showAdvancedOptions && (
    <>
      <div className="form-control">
        <label className="label">
          <span className="label-text">负面提示</span>
        </label>
        <textarea
          className="textarea textarea-bordered h-20"
          placeholder="指定不希望在图像中出现的元素..."
          {...register("negativePrompt")}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">种子值 (仅适用于Stable Diffusion)</span>
        </label>
        <input
          type="text"
          className="input input-bordered"
          placeholder="留空为随机"
          {...register("seed")}
        />
      </div>
    </>
  );
}

<div className="form-control mt-2">
  <label className="label cursor-pointer justify-start gap-2">
    <input
      type="checkbox"
      className="checkbox"
      checked={showAdvancedOptions}
      onChange={() => setShowAdvancedOptions(!showAdvancedOptions)}
    />
    <span className="label-text">显示高级选项</span>
  </label>
</div>;
```

## 环境变量更新

在`.env.local`文件中添加新的 API 密钥：

```
# OpenAI API Key
OPENAI_API_KEY=

# Replicate API Token
REPLICATE_API_TOKEN=

# Stability AI API Key
STABILITY_API_KEY=

# 本地Stable Diffusion API URL (如果使用)
LOCAL_SD_API_URL=http://localhost:7860/api/predict
```
