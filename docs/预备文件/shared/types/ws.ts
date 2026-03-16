// =============================================================================
// CyberGeek Blog - WebSocket 消息协议类型定义
// =============================================================================

// -----------------------------------------------------------------------------
// 消息基础结构
// -----------------------------------------------------------------------------

/**
 * WebSocket 消息基础结构。
 * 所有客户端与服务端之间传输的消息都遵循此格式。
 */
export interface WSMessage<T extends string = string, P = unknown> {
  /** 事件类型标识 */
  type: T;
  /** 房间标识（通常为天体 slug，全局事件时为 undefined） */
  room?: string;
  /** 消息负载数据 */
  payload: P;
  /** 消息发送时的 Unix 时间戳（毫秒） */
  timestamp: number;
  /** 消息唯一标识（UUID v4），用于去重和确认 */
  id: string;
}

// -----------------------------------------------------------------------------
// 事件类型枚举
// -----------------------------------------------------------------------------

/** 客户端 -> 服务端的事件类型 */
export type ClientEventType =
  | 'join_room'
  | 'leave_room'
  | 'ping'
  | 'cursor_move'
  | 'sync';

/** 服务端 -> 客户端的事件类型 */
export type ServerEventType =
  | 'pong'
  | 'room_state'
  | 'user_joined'
  | 'user_left'
  | 'satellite_launched'
  | 'reaction_added'
  | 'online_count'
  | 'error'
  | 'sync_response';

// -----------------------------------------------------------------------------
// 客户端 -> 服务端 Payload 定义
// -----------------------------------------------------------------------------

/**
 * 加入房间请求的负载。
 * 客户端进入某个天体页面时发送，以订阅该页面的实时事件。
 */
export interface JoinRoomPayload {
  /** 目标房间标识（天体 slug） */
  roomId: string;
  /** 访客昵称（可选，匿名用户可不填） */
  nickname?: string;
  /** 访客头像种子（用于生成确定性随机头像） */
  avatarSeed?: string;
}

/**
 * 离开房间请求的负载。
 * 客户端离开某个天体页面时发送。
 */
export interface LeaveRoomPayload {
  /** 要离开的房间标识 */
  roomId: string;
}

/**
 * 心跳 ping 负载。
 * 客户端定期发送以维持连接活跃状态。
 */
export interface PingPayload {
  /** 客户端本地时间戳，用于计算 RTT */
  clientTime: number;
}

/**
 * 光标移动负载。
 * 用于实时展示其他访客在页面上的光标位置（可选功能）。
 */
export interface CursorMovePayload {
  /** 光标在页面上的 X 坐标（相对于视口） */
  x: number;
  /** 光标在页面上的 Y 坐标（相对于视口） */
  y: number;
  /** 当前滚动位置百分比 [0, 1] */
  scrollPercent: number;
}

/**
 * 数据同步请求负载。
 * 客户端重连后请求同步丢失的事件。
 */
export interface SyncPayload {
  /** 客户端收到的最后一条消息 ID */
  lastMessageId: string;
  /** 需要同步的房间列表 */
  rooms: string[];
}

// -----------------------------------------------------------------------------
// 服务端 -> 客户端 Payload 定义
// -----------------------------------------------------------------------------

/**
 * 心跳 pong 响应负载。
 * 服务端回复客户端的 ping 请求。
 */
export interface PongPayload {
  /** 回传客户端发送的时间戳 */
  clientTime: number;
  /** 服务端当前时间戳 */
  serverTime: number;
}

/**
 * 房间状态快照负载。
 * 客户端加入房间后，服务端推送当前房间的完整状态。
 */
export interface RoomStatePayload {
  /** 房间标识 */
  roomId: string;
  /** 当前在线用户列表 */
  users: RoomUser[];
  /** 当前在线人数 */
  onlineCount: number;
}

/**
 * 房间内的用户信息。
 */
export interface RoomUser {
  /** 服务端分配的会话 ID */
  sessionId: string;
  /** 用户昵称 */
  nickname: string;
  /** 头像种子 */
  avatarSeed: string;
  /** 加入时间（Unix 时间戳，毫秒） */
  joinedAt: number;
}

/**
 * 用户加入房间通知负载。
 */
export interface UserJoinedPayload {
  /** 加入的用户信息 */
  user: RoomUser;
  /** 更新后的在线人数 */
  onlineCount: number;
}

/**
 * 用户离开房间通知负载。
 */
export interface UserLeftPayload {
  /** 离开的用户会话 ID */
  sessionId: string;
  /** 更新后的在线人数 */
  onlineCount: number;
}

/**
 * 新评论（卫星发射）通知负载。
 * 当有新评论发布时，服务端向房间内所有用户推送。
 */
export interface SatelliteLaunchedPayload {
  /** 评论 ID */
  commentId: string;
  /** 评论者昵称 */
  authorName: string;
  /** 头像种子 */
  avatarSeed: string;
  /** 渲染后的 HTML 内容 */
  contentHtml: string;
  /** 父评论 ID（回复时存在） */
  parentId?: string;
  /** 评论轨道参数 */
  orbitalParams: {
    ringIndex: number;
    orbitRadius: number;
    orbitInclination: number;
    phaseOffset: number;
    eccentricity: number;
    orbitalSpeed: number;
  };
  /** 评论创建时间 */
  createdAt: string;
}

/**
 * 新表情反应通知负载。
 */
export interface ReactionAddedPayload {
  /** 反应目标 ID */
  targetId: string;
  /** 表情符号 */
  emoji: string;
  /** 更新后的该表情总数 */
  count: number;
}

/**
 * 在线人数更新通知负载。
 */
export interface OnlineCountPayload {
  /** 当前在线人数 */
  count: number;
  /** 房间标识（全局事件时为 undefined） */
  roomId?: string;
}

/**
 * 错误通知负载。
 */
export interface ErrorPayload {
  /** 错误码 */
  code: WSErrorCode;
  /** 人类可读的错误信息 */
  message: string;
  /** 触发错误的原始消息 ID（如果有） */
  originMessageId?: string;
}

/**
 * 同步响应负载。
 * 服务端在客户端重连后发送丢失的事件。
 */
export interface SyncResponsePayload {
  /** 丢失的消息列表（按时间顺序排列） */
  messages: WSMessage[];
  /** 是否还有更多历史消息未发送（超过上限时为 true） */
  hasMore: boolean;
}

// -----------------------------------------------------------------------------
// 错误码
// -----------------------------------------------------------------------------

/**
 * WebSocket 错误码枚举。
 * 遵循 WebSocket 关闭码规范中的自定义区间（4000-4999）。
 */
export enum WSErrorCode {
  /** 认证失败：token 无效或已过期 */
  AUTH_FAILED = 4001,
  /** 房间不存在：请求加入的房间标识无效 */
  ROOM_NOT_FOUND = 4002,
  /** 频率超限：客户端发送消息过于频繁 */
  RATE_LIMITED = 4003,
  /** 格式错误：消息格式不符合协议规范 */
  MALFORMED_MESSAGE = 4004,
}

// -----------------------------------------------------------------------------
// 类型化消息快捷类型
// -----------------------------------------------------------------------------

/** 客户端发送：加入房间 */
export type JoinRoomMessage = WSMessage<'join_room', JoinRoomPayload>;

/** 客户端发送：离开房间 */
export type LeaveRoomMessage = WSMessage<'leave_room', LeaveRoomPayload>;

/** 客户端发送：心跳 */
export type PingMessage = WSMessage<'ping', PingPayload>;

/** 客户端发送：光标移动 */
export type CursorMoveMessage = WSMessage<'cursor_move', CursorMovePayload>;

/** 客户端发送：同步请求 */
export type SyncMessage = WSMessage<'sync', SyncPayload>;

/** 服务端发送：心跳响应 */
export type PongMessage = WSMessage<'pong', PongPayload>;

/** 服务端发送：房间状态快照 */
export type RoomStateMessage = WSMessage<'room_state', RoomStatePayload>;

/** 服务端发送：用户加入通知 */
export type UserJoinedMessage = WSMessage<'user_joined', UserJoinedPayload>;

/** 服务端发送：用户离开通知 */
export type UserLeftMessage = WSMessage<'user_left', UserLeftPayload>;

/** 服务端发送：新评论通知 */
export type SatelliteLaunchedMessage = WSMessage<'satellite_launched', SatelliteLaunchedPayload>;

/** 服务端发送：新反应通知 */
export type ReactionAddedMessage = WSMessage<'reaction_added', ReactionAddedPayload>;

/** 服务端发送：在线人数更新 */
export type OnlineCountMessage = WSMessage<'online_count', OnlineCountPayload>;

/** 服务端发送：错误通知 */
export type ErrorMessage = WSMessage<'error', ErrorPayload>;

/** 服务端发送：同步响应 */
export type SyncResponseMessage = WSMessage<'sync_response', SyncResponsePayload>;

/** 所有客户端消息的联合类型 */
export type ClientMessage =
  | JoinRoomMessage
  | LeaveRoomMessage
  | PingMessage
  | CursorMoveMessage
  | SyncMessage;

/** 所有服务端消息的联合类型 */
export type ServerMessage =
  | PongMessage
  | RoomStateMessage
  | UserJoinedMessage
  | UserLeftMessage
  | SatelliteLaunchedMessage
  | ReactionAddedMessage
  | OnlineCountMessage
  | ErrorMessage
  | SyncResponseMessage;

/** 所有 WebSocket 消息的联合类型 */
export type AnyWSMessage = ClientMessage | ServerMessage;
