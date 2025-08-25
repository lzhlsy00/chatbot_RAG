# Coze API Postman 测试指南

## 1. 基本配置

### API 端点
```
POST https://api.coze.cn/v3/chat
```

### Headers
```
Authorization: Bearer pat_ojyrwwZtfVbo1DGcDFmIcIDMAzu1ZYOSzXD36De0o8JS42C7iWVVTitDoZfkJlzL
Content-Type: application/json
```

## 2. 请求体 (Body)

选择 `raw` 和 `JSON` 格式，输入以下内容：

```json
{
  "bot_id": "7541264565876244514",
  "user_id": "user",
  "stream": true,
  "auto_save_history": true,
  "additional_messages": [
    {
      "role": "user",
      "content": "请介绍一下RAG系统",
      "content_type": "text"
    }
  ]
}
```

## 3. 测试步骤

1. **创建新请求**
   - 打开 Postman
   - 点击 "New" → "Request"
   - 选择 POST 方法

2. **设置 URL**
   - 输入：`https://api.coze.cn/v3/chat`

3. **设置 Headers**
   - 添加 `Authorization: Bearer YOUR_TOKEN`
   - 添加 `Content-Type: application/json`

4. **设置 Body**
   - 选择 "Body" → "raw" → "JSON"
   - 粘贴上面的 JSON 请求体

5. **发送请求**
   - 点击 "Send"
   - 查看响应

## 4. 流式响应处理

由于 API 返回的是流式响应 (SSE)，在 Postman 中可能看到的是事件流格式：

```
event: conversation.message.delta
data: {"role": "assistant", "content": "RAG"}

event: conversation.message.delta
data: {"role": "assistant", "content": "系统是..."}

event: conversation.message.completed
data: {"conversation_id": "xxx", "message_id": "xxx"}

event: done
data: {}
```

## 5. 非流式请求

如果想看到完整的响应，可以设置 `stream: false`：

```json
{
  "bot_id": "7541264565876244514",
  "user_id": "user",
  "stream": false,
  "auto_save_history": true,
  "additional_messages": [
    {
      "role": "user",
      "content": "请介绍一下RAG系统",
      "content_type": "text"
    }
  ]
}
```

## 6. 查找引用信息

在响应中查找以下可能包含引用的字段：
- `citations`
- `references`
- `sources`
- `knowledge_base`
- `extra_info`
- `metadata`

## 7. 使用 cURL 测试（替代方案）

```bash
curl -X POST https://api.coze.cn/v3/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bot_id": "7541264565876244514",
    "user_id": "user",
    "stream": false,
    "additional_messages": [{
      "role": "user",
      "content": "请介绍一下RAG系统",
      "content_type": "text"
    }]
  }'
```

## 注意事项

1. 确保 Token 和 Bot ID 正确
2. 流式响应在 Postman 中可能显示不完整
3. 建议先使用非流式模式查看完整响应结构
4. 注意查看响应中的所有字段，特别是嵌套的对象