import type { CardListData, Config, IntegrationUserConfig, ThemeUserConfig } from 'astro-pure/types'

export const theme: ThemeUserConfig = {
  // === Basic configuration ===
  /** Title for your website. Will be used in metadata and as browser tab title. */
  title: '星河避难所',
  /** Will be used in index page & copyright declaration */
  author: '何俊杰',
  /** Description metadata for your website. Can be used in page metadata. */
  description: '写代码，也写自己',
  /** The default favicon for your site which should be a path to an image in the `public/` directory. */
  favicon: '/favicon/favicon.ico',
  /** Specify the default language for this site. */
  locale: {
    lang: 'zh-CN',
    attrs: 'zh_CN',
    // Date locale
    dateLocale: 'zh-CN',
    dateOptions: {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }
  },
  /** Set a logo image to show in the homepage. */
  logo: {
    src: 'src/assets/avatar.png',
    alt: 'Avatar'
  },

  // === Global configuration ===
  titleDelimiter: '•',
  prerender: true,
  npmCDN: 'https://cdn.jsdelivr.net/npm',

  // Still in test
  head: [
    /* Telegram channel */
    // {
    //   tag: 'meta',
    //   attrs: { name: 'telegram:channel', content: '@cworld0_cn' },
    //   content: ''
    // }
  ],
  customCss: [],

  /** Configure the header of your site. */
  header: {
    menu: [
      { title: '文章', link: '/blog' },
      { title: '项目', link: '/projects' },
      { title: '关于我', link: '/about' }
    ]
  },

  /** Configure the footer of your site. */
  footer: {
    // Year format
    year: `© ${new Date().getFullYear()}`,
    // year: `© 2019 - ${new Date().getFullYear()}`,
    links: [
      // Registration link
      {
        title: '鲁ICP备2025143078号-1',
        link: 'https://beian.mps.gov.cn/#/query/webSearch',
        style: 'text-sm' // Uno/TW CSS class
      },
      // Privacy Policy link
      {
        title: '更多便捷工具',
        link: '/projects/list',
        pos: 2 // position set to 2 will be appended to copyright line
      }
    ],
    /** Enable displaying a “Astro & Pure theme powered” link in your site’s footer. */
    credits: false,
    /** Optional details about the social media accounts for this site. */
    social: { github: 'https://github.com/zxc7563598' }
  },

  content: {
    /** External links configuration */
    externalLinks: {
      content: ' ↗',
      /** Properties for the external links element */
      properties: {
        style: 'user-select:none'
      }
    },
    /** Blog page size for pagination (optional) */
    blogPageSize: 8,
    // Currently support weibo, x, bluesky
    share: ['weibo', 'x', 'bluesky']
  }
}

export const integ: IntegrationUserConfig = {
  // Enable page search function
  pagefind: true,
  // Add a random quote to the footer (default on homepage footer)
  // See: https://astro-pure.js.org/docs/integrations/advanced#web-content-render
  quote: {
    // https://developer.hitokoto.cn/sentence/#%E8%AF%B7%E6%B1%82%E5%9C%B0%E5%9D%80
    // server: 'https://v1.hitokoto.cn/?c=i',
    // target: (data) => (data as { hitokoto: string }).hitokoto || 'Error'
    // https://github.com/lukePeavey/quotable
    server: 'https://v1.hitokoto.cn/?c=i',
    target: `(data) => data.hitokoto || 'Error'`
  },
  // UnoCSS typography
  // See: https://unocss.dev/presets/typography
  typography: {
    class: 'prose text-base text-muted-foreground',
    // The style of blockquote font, normal or italic (default to italic in typography)
    blockquoteStyle: 'italic',
    // The style of inline code block, code or modern (default to code in typography)
    inlineCodeBlockStyle: 'modern'
  },
  // A lightbox library that can add zoom effect
  // See: https://astro-pure.js.org/docs/integrations/others#medium-zoom
  mediumZoom: {
    enable: true, // disable it will not load the whole library
    selector: '.prose .zoomable',
    options: {
      className: 'zoomable'
    }
  },
  // Comment system
  waline: {
    enable: true,
    // Server service link
    server: 'https://waline.hejunjie.life/',
    // Refer https://waline.js.org/en/guide/features/emoji.html
    emoji: ['bmoji', 'weibo'],
    // Refer https://waline.js.org/en/reference/client/props.html
    additionalConfigs: {
      // search: false,
      pageview: true,
      comment: true,
      locale: {
        reaction0: '喜欢',
        placeholder: '欢迎发表评论。（通过电子邮件接收回复。无需登录，但起码你要在上面写上电子邮箱才会收到邮件）'
      },
      imageUploader: false
    }
  }
}

export const metrics: { enable: boolean; sdk: string; id: string; ck: string; widget: string } = {
  // 51.la 统计
  enable: true,
  // 统计网站的配置信息
  // 在统计网站的后台获取
  // See: https://v6.51.la/report/setup/params/statistics
  sdk: '/scripts/js-sdk-pro.min.js',
  id: '3K0Dk6gsiH5Cx3N3',
  ck: '3K0Dk6gsiH5Cx3N3',
  // 数据挂件 javascript 地址，类似：https://v6-widget.51.la/v6/3K0Dk6gsiH5Cx3N3/quote.js
  // See: https://v6.51.la/report/setup/params/widget
  widget: 'https://v6-widget.51.la/v6/3K0Dk6gsiH5Cx3N3/quote.js'
}

export const terms: CardListData = {
  title: '更多便捷工具',
  list: [
    {
      title: '身份证信息查询',
      link: '/composer/china-division'
    },
    {
      title: '手机号信息查询',
      link: '/composer/mobile-locator'
    },
    {
      title: '地址解析工具',
      link: '/composer/address-parser'
    },
    {
      title: '八字排盘',
      link: '/composer/fortune-analyzer'
    },
    {
      title: '随机头像生成',
      link: '/projects/item/avatar-service'
    }
  ]
}

const config = { ...theme, integ } as Config
export default config
