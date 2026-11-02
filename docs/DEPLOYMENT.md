# 公开Demo部署记录

- 日期：2026年11月2日（America/New_York）
- 生产网址：[https://client-advisor-assistant.vercel.app](https://client-advisor-assistant.vercel.app)
- 平台：Vercel；状态READY；应用版本0.1.6
- 项目ID：`prj_r620CuUoduRSKNQ1PhOWT4UckfYi`
- 部署ID：`dpl_8J8r2pcPAPsbvN7TLJSdSqNABXhC`
- 生产/预览环境设置：`NEXT_PUBLIC_DEMO_ONLY=1`
- 公开环境未配置OpenAI密钥；实时Agent仅在本地运行。
- 发布内容仅含应用源码、依赖锁文件及TypeScript配置。没有上传挑战PDF、密钥、评测记录或报告。

验证：未登录HTTP访问首页200；浏览器首页正确显示公开示例工作区，生成方式只有示例。六场景的示例请求均200并返回三条文案；直接实时生成请求403；不联系请求200并返回内部提示。以上验证未调用模型。Vercel最近10分钟运行错误扫描未发现错误；未配置长期监控或日志转发。

本次为源码文件直接部署，不依赖GitHub连接。将来在GitHub发布仓库后，可在同一Vercel项目连接该仓库以自动部署；请保留示例模式环境变量，不要上传本地密钥。
