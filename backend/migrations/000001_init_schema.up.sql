-- ============================================================================
-- CyberGeek 宇宙主题博客系统 — 初始数据库 Schema
-- 数据库: PostgreSQL 16
-- 迁移编号: 001_init_schema
-- 描述: 创建所有基础表、索引、约束及默认站点配置
-- ============================================================================

-- --------------------------------------------------------------------------
-- 扩展
-- --------------------------------------------------------------------------

-- UUID 生成（UUIDv7 由 Go 端生成，此处仅确保类型支持）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 向量检索（用于文章语义搜索 embedding）
CREATE EXTENSION IF NOT EXISTS "vector";

-- --------------------------------------------------------------------------
-- 自定义枚举类型
-- --------------------------------------------------------------------------

-- 用户角色枚举
CREATE TYPE user_role AS ENUM ('admin', 'author', 'viewer');

-- --------------------------------------------------------------------------
-- 1. users — 博主/作者
-- 支持多作者系统，含 TOTP 两步验证
-- --------------------------------------------------------------------------
CREATE TABLE users (
    id              UUID        PRIMARY KEY,            -- UUIDv7，Go 端生成
    display_name    VARCHAR(100) NOT NULL,               -- 显示名称
    email           VARCHAR(255) NOT NULL UNIQUE,        -- 登录邮箱，唯一
    password_hash   VARCHAR(255) NOT NULL,               -- Argon2id 哈希
    avatar_url      VARCHAR(500),                        -- 头像 URL
    role            user_role   NOT NULL DEFAULT 'author', -- 用户角色
    totp_secret     VARCHAR(255),                        -- TOTP 密钥（加密存储）
    totp_enabled    BOOLEAN     NOT NULL DEFAULT false,  -- 是否启用两步验证
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  users IS '博主/作者表，支持多作者与 TOTP 两步验证';
COMMENT ON COLUMN users.id IS 'UUIDv7 主键，由 Go 端 uuid.NewV7() 生成';
COMMENT ON COLUMN users.totp_secret IS 'TOTP 密钥，启用两步验证后填充';

-- --------------------------------------------------------------------------
-- 2. galaxies — 星系(主分类) 与 恒星(子分类)
-- parent_id 自引用：NULL=星系(中心有超大质量黑洞)，非NULL=恒星(围绕父星系黑洞公转)
-- 恒星生命周期由 article_count 驱动：<10 原恒星盘、≥10 主序星、≥50 巨星、≥100 红巨星
-- --------------------------------------------------------------------------
CREATE TABLE galaxies (
    id              UUID        PRIMARY KEY,
    parent_id       UUID        REFERENCES galaxies(id) ON DELETE SET NULL,  -- 父分类，NULL=星系，非NULL=恒星
    name            VARCHAR(100) NOT NULL,               -- 分类名称
    slug            VARCHAR(100) NOT NULL UNIQUE,         -- URL 友好标识
    description     TEXT,                                 -- 分类描述
    color_scheme    JSONB,                                -- 配色方案 {"primary": "#xxx", "secondary": "#xxx"}
    position        JSONB,                                -- 宇宙空间坐标 {"x": 0, "y": 0, "z": 0}（星系=绝对坐标，恒星=相对父星系的轨道参数）
    sort_order      INT         NOT NULL DEFAULT 0,       -- 排序权重，升序
    article_count   INT         NOT NULL DEFAULT 0,       -- 该分类下文章总数（自动维护），决定恒星生命周期阶段
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  galaxies IS '星系(主分类)/恒星(子分类)表。parent_id IS NULL=星系(中心有超大质量黑洞)；parent_id IS NOT NULL=恒星(子分类，围绕父星系中心公转)';
COMMENT ON COLUMN galaxies.parent_id IS 'NULL=顶级星系(主分类)，非NULL=恒星(子分类)，FK 自引用';
COMMENT ON COLUMN galaxies.article_count IS '文章计数，决定恒星视觉：<10 原恒星盘(暗淡)、≥10 主序星(明亮)、≥50 巨星(膨胀)、≥100 红巨星(深红)';
COMMENT ON COLUMN galaxies.position IS '星系=宇宙绝对坐标；恒星=相对父星系的轨道参数(orbit_radius, phase_offset等)';

CREATE INDEX idx_galaxies_parent_id ON galaxies(parent_id);
CREATE INDEX idx_galaxies_sort_order ON galaxies(sort_order);

-- --------------------------------------------------------------------------
-- 3. celestial_bodies — 天体/文章/草稿
-- 核心内容表，支持多语言、向量搜索、全文检索
-- 行星围绕恒星(子分类)公转，通过 star_id FK 关联
-- BLACKHOLE 类型已移除——黑洞现在是星系中心的视觉元素，不是独立天体
-- --------------------------------------------------------------------------
CREATE TABLE celestial_bodies (
    id                  UUID        PRIMARY KEY,
    type                VARCHAR(20) NOT NULL
                        CHECK (type IN ('PLANET', 'ASTEROID', 'PULSAR')),
                                                          -- 天体类型：行星(文章)/小行星(草稿)/脉冲星(简介)
    galaxy_id           UUID        NOT NULL REFERENCES galaxies(id) ON DELETE RESTRICT,
    star_id             UUID        REFERENCES galaxies(id) ON DELETE SET NULL,
                                                          -- 所属恒星(子分类)，NULL=未归类(围绕星系中心游离)
    author_id           UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title               VARCHAR(300) NOT NULL,             -- 文章标题
    slug                VARCHAR(300) NOT NULL UNIQUE,      -- URL 友好标识
    content             TEXT,                               -- Markdown 明文内容
    summary             TEXT,                                -- 文章摘要
    physics_params      JSONB,                              -- 天体物理参数（轨道、质量等视觉属性）
    aesthetics_params   JSONB,                              -- 美学参数（粒子效果、光晕等）
    base_coordinates    JSONB,                              -- 天体在宇宙空间的基础坐标
    embedding           vector(768),                        -- 语义向量，用于相似文章推荐
    tags                TEXT[]      DEFAULT '{}',           -- 冗余标签数组，便于 GIN 索引查询
    locale              VARCHAR(10) NOT NULL DEFAULT 'zh',  -- i18n 语言标识
    word_count          INT         NOT NULL DEFAULT 0,     -- 字数统计
    view_count          INT         NOT NULL DEFAULT 0,     -- 阅读总量（从 Redis 持久化）
    comment_count       INT         NOT NULL DEFAULT 0,     -- 评论计数（冗余，提升查询性能）
    status              VARCHAR(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published', 'archived')),
                                                            -- 发布状态
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at        TIMESTAMPTZ,                        -- 首次发布时间
    deleted_at          TIMESTAMPTZ,                        -- 软删除时间戳，NULL 表示未删除

    -- 全文检索生成列：基于 title 和 content 的 tsvector
    -- 使用 simple 分词配置
    tsv                 tsvector    GENERATED ALWAYS AS (
                            setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
                            setweight(to_tsvector('simple', coalesce(summary, '')), 'B') ||
                            setweight(to_tsvector('simple', coalesce(content, '')), 'C')
                        ) STORED
);

COMMENT ON TABLE  celestial_bodies IS '天体/文章表，核心内容实体，支持多语言、向量搜索';
COMMENT ON COLUMN celestial_bodies.type IS '天体类型：PLANET(文章), ASTEROID(草稿/灵感), PULSAR(个人简介)';
COMMENT ON COLUMN celestial_bodies.star_id IS '所属恒星(子分类) FK→galaxies(parent_id IS NOT NULL的记录)。NULL表示未归入子分类';
COMMENT ON COLUMN celestial_bodies.embedding IS '768 维语义向量，用于相似文章推荐（pgvector）';
COMMENT ON COLUMN celestial_bodies.tags IS '冗余标签数组，与 body_tags 关联表保持同步';
COMMENT ON COLUMN celestial_bodies.view_count IS '持久化阅读量，由 Redis 定期同步写入';
COMMENT ON COLUMN celestial_bodies.tsv IS '全文检索向量，基于 zhparser 中文分词，title 权重 A > summary 权重 B > content 权重 C';

-- 复合索引：按分类、类型、状态查询文章列表
CREATE INDEX idx_cb_galaxy_type_status
    ON celestial_bodies(galaxy_id, type, status);

-- 发布时间降序索引：时间线查询
CREATE INDEX idx_cb_published_at_desc
    ON celestial_bodies(published_at DESC NULLS LAST);

-- 类型 + 软删除复合索引：按类型查询未删除文章
CREATE INDEX idx_cb_type_deleted
    ON celestial_bodies(type, deleted_at);

-- 部分索引：仅已发布且未删除的文章，优化前台查询
CREATE INDEX idx_cb_published_active
    ON celestial_bodies(published_at DESC)
    WHERE status = 'published' AND deleted_at IS NULL;

-- GIN 索引：JSONB 物理参数查询
CREATE INDEX idx_cb_physics_params
    ON celestial_bodies USING GIN (physics_params);

-- GIN 索引：TEXT[] 标签数组查询
CREATE INDEX idx_cb_tags
    ON celestial_bodies USING GIN (tags);

-- GIN 索引：全文检索
CREATE INDEX idx_cb_tsv
    ON celestial_bodies USING GIN (tsv);

-- IVFFlat 索引：向量余弦相似度搜索
-- 注意：IVFFlat 索引需要表中有数据后才能有效构建，
-- 初始阶段可先创建，后续数据量增大后可 REINDEX 优化
CREATE INDEX idx_cb_embedding
    ON celestial_bodies USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- author_id 索引：按作者查询文章
CREATE INDEX idx_cb_author_id
    ON celestial_bodies(author_id);

-- locale 索引：多语言查询
CREATE INDEX idx_cb_locale
    ON celestial_bodies(locale);

-- --------------------------------------------------------------------------
-- 4. comments — 评论
-- 支持嵌套回复（parent_comment_id 自引用），完整 Markdown
-- 不存储 IP（隐私保护），评论者信息：昵称 + 邮箱(可选) + 网站(可选)
-- --------------------------------------------------------------------------
CREATE TABLE comments (
    id                  UUID        PRIMARY KEY,
    body_id             UUID        NOT NULL REFERENCES celestial_bodies(id) ON DELETE CASCADE,
    parent_comment_id   UUID        REFERENCES comments(id) ON DELETE CASCADE,  -- 父评论，NULL 表示顶级评论
    author_name         VARCHAR(100) NOT NULL,              -- 评论者昵称
    author_email        VARCHAR(255),                       -- 评论者邮箱（可选）
    author_url          VARCHAR(500),                       -- 评论者网站 URL（可选）
    avatar_seed         VARCHAR(64),                        -- 头像生成种子（用于生成唯一默认头像）
    content             TEXT        NOT NULL,                -- Markdown 原始内容
    content_html        TEXT,                                -- 渲染后的 HTML（服务端预渲染）
    orbital_params      JSONB,                               -- 评论在宇宙空间的轨道参数（视觉效果）
    is_pinned           BOOLEAN     NOT NULL DEFAULT false,  -- 是否置顶
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ                          -- 软删除
);

COMMENT ON TABLE  comments IS '评论表，支持嵌套回复与完整 Markdown，隐私保护不存储 IP';
COMMENT ON COLUMN comments.avatar_seed IS '头像生成种子，用于 DiceBear 等服务生成唯一默认头像';
COMMENT ON COLUMN comments.content_html IS '服务端预渲染的安全 HTML，避免前端重复解析';

-- 复合索引：按文章 + 创建时间查询评论列表
CREATE INDEX idx_comments_body_created
    ON comments(body_id, created_at);

-- 父评论索引：查询回复树
CREATE INDEX idx_comments_parent
    ON comments(parent_comment_id);

-- --------------------------------------------------------------------------
-- 5. tags — 标签
-- --------------------------------------------------------------------------
CREATE TABLE tags (
    id              UUID        PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,        -- 标签名称
    slug            VARCHAR(100) NOT NULL UNIQUE,         -- URL 友好标识
    color           VARCHAR(7),                           -- 标签颜色 HEX，如 #FF5733
    post_count      INT         NOT NULL DEFAULT 0,       -- 关联文章计数（冗余，提升查询性能）
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE tags IS '标签表，post_count 冗余计数通过触发器或应用层维护';

-- --------------------------------------------------------------------------
-- 6. body_tags — 文章-标签 多对多关联
-- --------------------------------------------------------------------------
CREATE TABLE body_tags (
    body_id         UUID        NOT NULL REFERENCES celestial_bodies(id) ON DELETE CASCADE,
    tag_id          UUID        NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (body_id, tag_id)
);

COMMENT ON TABLE body_tags IS '文章与标签的多对多关联表';

-- 反向索引：按标签查文章
CREATE INDEX idx_body_tags_tag_id ON body_tags(tag_id);

-- --------------------------------------------------------------------------
-- 7. reactions — 表情反应
-- 基于 session_hash 去重，同一会话对同一目标同一 emoji 只能反应一次
-- --------------------------------------------------------------------------
CREATE TABLE reactions (
    id              UUID        PRIMARY KEY,
    target_type     VARCHAR(20) NOT NULL,                 -- 目标类型：'body' 或 'comment'
    target_id       UUID        NOT NULL,                 -- 目标 ID
    emoji           VARCHAR(10) NOT NULL,                 -- emoji 字符
    session_hash    VARCHAR(64) NOT NULL,                 -- 会话哈希（匿名去重）
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 唯一约束：同一会话对同一目标同一 emoji 只能反应一次
    UNIQUE (target_type, target_id, emoji, session_hash)
);

COMMENT ON TABLE reactions IS '表情反应表，基于 session_hash 实现匿名去重';

-- 按目标查询反应
CREATE INDEX idx_reactions_target
    ON reactions(target_type, target_id);

-- --------------------------------------------------------------------------
-- 8. uploads — 媒体文件
-- --------------------------------------------------------------------------
CREATE TABLE uploads (
    id              UUID        PRIMARY KEY,
    filename        VARCHAR(255) NOT NULL,                -- 存储文件名（含扩展名）
    original_name   VARCHAR(500) NOT NULL,                -- 原始上传文件名
    mime_type       VARCHAR(100) NOT NULL,                -- MIME 类型
    size            BIGINT      NOT NULL,                 -- 文件大小（字节）
    storage_type    VARCHAR(20) NOT NULL DEFAULT 'local', -- 存储类型：local / s3 / cos
    storage_path    VARCHAR(500),                          -- 本地或对象存储路径
    cdn_url         VARCHAR(500),                          -- CDN 加速 URL
    width           INT,                                   -- 图片宽度（像素）
    height          INT,                                   -- 图片高度（像素）
    blurhash        VARCHAR(100),                          -- BlurHash 缩略图占位符
    uploader_id     UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  uploads IS '媒体文件表，支持本地存储与对象存储，含 BlurHash 占位图';
COMMENT ON COLUMN uploads.blurhash IS 'BlurHash 编码，用于图片加载前的模糊占位';

CREATE INDEX idx_uploads_uploader ON uploads(uploader_id);
CREATE INDEX idx_uploads_mime_type ON uploads(mime_type);

-- --------------------------------------------------------------------------
-- 9. friend_links — 友链
-- --------------------------------------------------------------------------
CREATE TABLE friend_links (
    id              UUID        PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,                -- 友链站点名称
    url             VARCHAR(500) NOT NULL,                -- 友链 URL
    description     TEXT,                                  -- 友链描述
    icon_seed       VARCHAR(100),                          -- 图标生成种子
    sort_order      INT         NOT NULL DEFAULT 0,       -- 排序权重
    is_active       BOOLEAN     NOT NULL DEFAULT true,    -- 是否启用
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE friend_links IS '友链表，通过 sort_order 控制显示顺序';

CREATE INDEX idx_friend_links_active_sort
    ON friend_links(is_active, sort_order);

-- --------------------------------------------------------------------------
-- 10. subscribers — 订阅者
-- --------------------------------------------------------------------------
CREATE TABLE subscribers (
    id                  UUID        PRIMARY KEY,
    email               VARCHAR(255) NOT NULL UNIQUE,     -- 订阅邮箱
    confirmed           BOOLEAN     NOT NULL DEFAULT false, -- 是否已确认
    frequency           VARCHAR(20) NOT NULL DEFAULT 'weekly'
                        CHECK (frequency IN ('daily', 'weekly', 'monthly')),
                                                           -- 推送频率
    confirm_token       VARCHAR(255),                      -- 确认令牌
    unsubscribe_token   VARCHAR(255),                      -- 退订令牌
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE subscribers IS '邮件订阅者表，支持确认流程与多种推送频率';

CREATE INDEX idx_subscribers_confirmed
    ON subscribers(confirmed)
    WHERE confirmed = true;

-- --------------------------------------------------------------------------
-- 11. webhook_configs — Webhook 配置
-- --------------------------------------------------------------------------
CREATE TABLE webhook_configs (
    id                  UUID        PRIMARY KEY,
    url                 VARCHAR(500) NOT NULL,             -- Webhook 回调 URL
    events              TEXT[]      NOT NULL DEFAULT '{}', -- 订阅的事件列表
    secret              VARCHAR(255),                      -- 签名密钥（HMAC）
    is_active           BOOLEAN     NOT NULL DEFAULT true, -- 是否启用
    last_triggered_at   TIMESTAMPTZ,                       -- 最近触发时间
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE webhook_configs IS 'Webhook 配置表，支持事件订阅与 HMAC 签名验证';

-- --------------------------------------------------------------------------
-- 12. site_settings — 站点配置键值对
-- --------------------------------------------------------------------------
CREATE TABLE site_settings (
    key             VARCHAR(100) PRIMARY KEY,              -- 配置键名
    value           JSONB       NOT NULL,                  -- 配置值（JSONB 支持各种结构）
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE site_settings IS '站点配置键值对表，值为 JSONB 支持任意结构';

-- --------------------------------------------------------------------------
-- 13. article_versions — 文章版本历史
-- --------------------------------------------------------------------------
CREATE TABLE article_versions (
    id                  UUID        PRIMARY KEY,
    body_id             UUID        NOT NULL REFERENCES celestial_bodies(id) ON DELETE CASCADE,
    content             TEXT,                               -- 该版本的内容快照
    physics_params      JSONB,                              -- 该版本的物理参数快照
    version_num         INT         NOT NULL,               -- 版本号（递增）
    change_summary      VARCHAR(500),                       -- 变更摘要
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- 同一文章的版本号唯一
    UNIQUE (body_id, version_num)
);

COMMENT ON TABLE article_versions IS '文章版本历史表，保存每次编辑的内容快照';

-- 按文章查版本列表
CREATE INDEX idx_article_versions_body
    ON article_versions(body_id, version_num DESC);

-- --------------------------------------------------------------------------
-- updated_at 自动更新触发器函数
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trigger_set_updated_at() IS '通用触发器函数：自动更新 updated_at 字段';

-- 为所有含 updated_at 字段的表绑定触发器
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_galaxies_updated_at
    BEFORE UPDATE ON galaxies
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_celestial_bodies_updated_at
    BEFORE UPDATE ON celestial_bodies
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER trg_site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- --------------------------------------------------------------------------
-- Seed 数据：默认站点配置
-- --------------------------------------------------------------------------

INSERT INTO site_settings (key, value) VALUES
    ('site.title',          '"CyberGeek"'::jsonb),
    ('site.subtitle',       '"探索数字宇宙的极客博客"'::jsonb),
    ('site.description',    '"CyberGeek — 一个以宇宙为主题的技术博客，在星辰大海中记录代码与思考。"'::jsonb),
    ('site.url',            '"https://cybergeek.dev"'::jsonb),
    ('site.locale',         '"zh"'::jsonb),
    ('site.timezone',       '"Asia/Shanghai"'::jsonb),
    ('site.admin_path',     '"/admin_199209173332"'::jsonb),
    ('site.footer_text',    '"© CyberGeek. 在宇宙尽头写代码。"'::jsonb),
    ('site.icp_number',     'null'::jsonb),

    -- 宇宙主题视觉配置
    ('theme.star_density',       '800'::jsonb),
    ('theme.nebula_enabled',     'true'::jsonb),
    ('theme.particle_effect',    '"constellation"'::jsonb),
    ('theme.background_color',   '"#0a0a1a"'::jsonb),
    ('theme.accent_color',       '"#6c63ff"'::jsonb),

    -- 评论配置
    ('comment.enabled',          'true'::jsonb),
    ('comment.require_email',    'false'::jsonb),
    ('comment.moderation',       '"none"'::jsonb),
    ('comment.max_depth',        '3'::jsonb),

    -- SEO 配置
    ('seo.robots',               '"index, follow"'::jsonb),
    ('seo.og_image',             'null'::jsonb),
    ('seo.twitter_handle',       'null'::jsonb),

    -- 订阅配置
    ('subscription.enabled',     'true'::jsonb),
    ('subscription.provider',    '"smtp"'::jsonb),

    -- RSS 配置
    ('rss.enabled',              'true'::jsonb),
    ('rss.full_content',         'true'::jsonb),
    ('rss.items_limit',          '50'::jsonb)

ON CONFLICT (key) DO NOTHING;
