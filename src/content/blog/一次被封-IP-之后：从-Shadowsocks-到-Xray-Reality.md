---
title: '一次被封 IP 之后：从 Shadowsocks 到 Xray Reality'
publishDate: '2026-03-09 15:17:12'
description: '记录一次服务器 IP 被封后的折腾过程，从早期的 Shadowsocks 到基于 Xray 的 VLESS + Reality 方案，整理了服务端安装、配置文件结构以及 Clash 客户端规则'
tags:
  - Web
language: '中文'
heroImage: { src: './cover/web.jpg', color: '#3594ec' }
draft: false
slug: 'jaai7bt0'
password:
  - { question: '内容较为敏感，如需阅读可联系作者获取密码', answer: '7563598' }
---

> ⚠️ 本文仅为个人技术研究记录，用于学习网络协议与服务器部署，请遵守当地法律法规。

我之前一直用的是 Shadowsocks，配置简单、部署也很轻量。一台服务器开个端口基本就能跑起来，用了很长一段时间都没什么问题。

原本的文章链接在这里，密码是一样的：[点击前往](/blog/hqnd9ut2)

直到有一天，我发现它突然连不上了。

服务器本身是正常的，SSH 也能登录，国外访问也没问题，但国内连接就是不通。简单排查了一圈之后，基本可以确定是 **IP 被封** 了。

这种情况其实挺常见的，尤其是长期使用单一协议的时候。

幸好云服务器可以通过弹性IP去切换IP，于是我干脆把这次当成一个契机，重新研究了一下现在主流的一些方案，最后选择了基于 Xray 的 **VLESS + Reality** 组合。

这篇文章就简单记录一下整个折腾过程。

---

## 安装 Xray

官方提供了一个非常方便的安装脚本，仓库在这里：[https://github.com/XTLS/Xray-install](https://github.com/XTLS/Xray-install)

只需要执行脚本里的 `install-release.sh` 就可以完成安装。

```bash
bash install-release.sh
```

安装完成之后，一般会生成两个主要文件：

```bash
/usr/local/bin/xray
/usr/local/etc/xray/config.json
```

其中：

- ​`/usr/local/bin/xray` 是程序本体
- ​`/usr/local/etc/xray/config.json` 是默认配置文件

后续我们主要就是修改这个配置文件。

---

## 生成 UUID

在使用 VLESS 的时候，需要一个 **UUID** 作为客户端身份标识。

最简单的方式是直接在服务器上生成：

```bash
cat /proc/sys/kernel/random/uuid
```

输出类似这样：`c9a1e0f2-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

只要是标准 UUID 格式就可以，用在线工具生成其实也没问题。

这个 UUID 后面会写进配置文件里，同时客户端也需要使用同一个值。

---

## 生成密钥对

Reality 需要使用一对 ​**X25519 密钥**。

可以直接用 Xray 自带的命令生成：

```bash
xray x25519
```

会得到类似这样的输出：

```bash
PrivateKey: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PublicKey:  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Hash32:     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

其中：

- ​**PrivateKey**：服务端使用
- ​**PublicKey**：客户端使用
- ​**Hash32**：用于校验

简单理解就是：

- 服务端持有私钥
- 客户端使用公钥进行连接

---

## 完善配置文件

接下来需要修改 Xray 的配置文件：`/usr/local/etc/xray/config.json`

在编写配置之前，需要确保服务器端口是开放的，没有被防火墙拦截。可以通过下面的方式简单检查：

```bash
nc -vz 服务器IP 端口号
```

如果端口是通的，一般会看到类似：`Connection to xxx.xxx.xxx.xxx port xxxx [tcp/*] succeeded!`

配置文件本身其实就是一份 JSON 结构，大致包含几个部分：

- ​**inbounds**：客户端入口
- ​**outbounds**：流量出口
- ​**routing**：路由规则
- **realitySettings**：Reality 相关配置

个人自用的完整配置模板如下：

```yml
{
  'log': { 'loglevel': 'debug' },
  'inbounds':
    [
      {
        'port': 服务器端口,
        'protocol': 'vless',
        'settings':
          {
            'clients': [{ 'id': '生成的UUID', 'flow': 'xtls-rprx-vision' }],
            'decryption': 'none',
            'fallbacks': [{ 'dest': 80 }]
          },
        'streamSettings':
          {
            'network': 'tcp',
            'security': 'reality',
            'realitySettings':
              {
                'show': false,
                'dest': 'www.cloudflare.com:443',
                'xver': 0,
                'serverNames': ['www.cloudflare.com'],
                'privateKey': '生成密钥对中的PrivateKey',
                'shortIds':
                  [
                    '0-16位字母或数字',
                    '自定义标识,类似密码,可以设置多个',
                    '客户端携带的信息与任意一个匹配则通过'
                  ]
              }
          },
        'sniffing': { 'enabled': true, 'destOverride': ['http', 'tls'] }
      }
    ],
  'outbounds': [{ 'protocol': 'freedom' }]
}
```

---

## 启动 Xray

配置完成之后，就可以通过 systemd 管理 Xray 服务了。

常用命令如下：

启动服务：

```bash
systemctl start xray
```

重启服务：

```bash
systemctl restart xray
```

查看状态：

```bash
systemctl status xray
```

查看实时日志：

```bash
journalctl -u xray -f
```

设置开机自启：

```bash
systemctl enable xray
```

如果配置有问题，日志里通常会直接报错，定位问题其实还算方便。

---

## 通过 Clash 连接

客户端我使用的是 Clash。

PC端我会选择 Clash Verge 「[GitHub](https://github.com/clash-verge-rev/clash-verge-rev)」「[官方网站](https://www.clashverge.dev/)」

移动端我会选择 FlClash 「[GitHub](https://github.com/chen08209/FlClash)」

Clash 的配置文件本质上是一个 YAML 文件，其中最核心的部分其实是 ​**规则（rules）** 。

规则的基本格式是：`匹配类型, 匹配内容, 处理方式`

例如：`DOMAIN-SUFFIX,google.com,Proxy`

意思是：所有以 `google.com`​ 结尾的域名，都通过 `Proxy` 这个代理组处理。

---

### 常见处理方式

规则匹配之后，需要决定如何处理流量。

常见的处理方式包括：

- **REJECT**: 拒绝访问。
- **BLOCK**: 同样是拒绝访问。
- **DIRECT**: 直接访问目标服务器，不经过代理。
- **代理组名称**: 如果填写的是代理组名称，例如：`Proxy`，就表示流量会交给 `proxy-groups` 中定义的名为 `Proxy` 的代理组处理。

---

### 常见匹配类型

**DOMAIN**

完全匹配域名

```text
DOMAIN,google.com,Proxy
```

只有 `google.com` 会匹配。

---

**DOMAIN-SUFFIX**

后缀匹配

```text
DOMAIN-SUFFIX,google.com,Proxy
```

例如：

- www.google.com
- mail.google.com

都会匹配。

---

**DOMAIN-KEYWORD**

关键字匹配

```text
DOMAIN-KEYWORD,google,Proxy
```

只要域名里包含 `google` 都会匹配，比如：

- google.com
- googleapis.com

---

**IP-CIDR**

IP 段匹配

```text
IP-CIDR,8.8.8.8/32,Proxy
```

这里 `/32` 表示精确匹配单个 IP。

---

**GEOIP**

按国家 IP 匹配

```text
GEOIP,CN,DIRECT
```

表示中国大陆 IP 直接连接，不走代理。

---

**MATCH**

默认规则

```text
MATCH,Proxy
```

如果前面的规则都没有匹配，就使用这个。

---

### 示例配置

下面是我个人使用的一份配置结构示例（隐去了服务器信息）：

```yml
port: 7890
socks-port: 7891
redir-port: 7892
allow-lan: false
mode: Rule
log-level: info
external-controller: 127.0.0.1:9090
secret: ''
cfw-bypass:
  - localhost
  - 127.*
  - 10.*
  - 172.16.*
  - 172.17.*
  - 172.18.*
  - 172.19.*
  - 172.20.*
  - 172.21.*
  - 172.22.*
  - 172.23.*
  - 172.24.*
  - 172.25.*
  - 172.26.*
  - 172.27.*
  - 172.28.*
  - 172.29.*
  - 172.30.*
  - 172.31.*
  - 192.168.*
  - <local>
cfw-latency-timeout: 3000
proxies:
  - name: 名称，我喜欢写我的服务器IP
    type: vless
    server: 我的服务器IP
    port: 服务端配置的端口
    uuid: 服务端配置的uuid
    network: tcp
    tls: true
    udp: false
    flow: xtls-rprx-vision
    servername: www.cloudflare.com
    client-fingerprint: chrome
    reality-opts:
      public-key: 服务端配置私钥对应的公钥
      short-id: 服务端配置的shortIds
proxy-groups:
  - name: 代理组名称
    type: select
    proxies:
      - proxies配置的名称
rules:
  - DOMAIN,hls.itunes.apple.com,代理组名称
  - DOMAIN,itunes.apple.com,代理组名称
  - DOMAIN,itunes.com,代理组名称
  - DOMAIN-SUFFIX,icloud.com,DIRECT
  - DOMAIN-SUFFIX,icloud-content.com,DIRECT
  - DOMAIN-SUFFIX,me.com,DIRECT
  - DOMAIN-SUFFIX,mzstatic.com,DIRECT
  - DOMAIN-SUFFIX,aaplimg.com,DIRECT
  - DOMAIN-SUFFIX,cdn-apple.com,DIRECT
  - DOMAIN-SUFFIX,apple.com,DIRECT
  ## 国内网站
  - DOMAIN-SUFFIX,akadns.net,DIRECT
  - DOMAIN-SUFFIX,akamaized.net,DIRECT
  - DOMAIN-SUFFIX,cn,DIRECT
  - DOMAIN-KEYWORD,-cn,DIRECT
  - DOMAIN-SUFFIX,126.com,DIRECT
  - DOMAIN-SUFFIX,126.net,DIRECT
  - DOMAIN-SUFFIX,127.net,DIRECT
  - DOMAIN-SUFFIX,163.com,DIRECT
  - DOMAIN-SUFFIX,360buyimg.com,DIRECT
  - DOMAIN-SUFFIX,36kr.com,DIRECT
  - DOMAIN-SUFFIX,acfun.tv,DIRECT
  - DOMAIN-SUFFIX,air-matters.com,DIRECT
  - DOMAIN-SUFFIX,aixifan.com,DIRECT
  - DOMAIN-KEYWORD,alicdn,DIRECT
  - DOMAIN-KEYWORD,alipay,DIRECT
  - DOMAIN-KEYWORD,taobao,DIRECT
  - DOMAIN-SUFFIX,amap.com,DIRECT
  - DOMAIN-SUFFIX,autonavi.com,DIRECT
  - DOMAIN-KEYWORD,baidu,DIRECT
  - DOMAIN-SUFFIX,bdimg.com,DIRECT
  - DOMAIN-SUFFIX,bdstatic.com,DIRECT
  - DOMAIN-SUFFIX,bilibili.com,DIRECT
  - DOMAIN-SUFFIX,caiyunapp.com,DIRECT
  - DOMAIN-SUFFIX,clouddn.com,DIRECT
  - DOMAIN-SUFFIX,cnbeta.com,DIRECT
  - DOMAIN-SUFFIX,cnbetacdn.com,DIRECT
  - DOMAIN-SUFFIX,cootekservice.com,DIRECT
  - DOMAIN-SUFFIX,csdn.net,DIRECT
  - DOMAIN-SUFFIX,ctrip.com,DIRECT
  - DOMAIN-SUFFIX,dgtle.com,DIRECT
  - DOMAIN-SUFFIX,dianping.com,DIRECT
  - DOMAIN-SUFFIX,douban.com,DIRECT
  - DOMAIN-SUFFIX,doubanio.com,DIRECT
  - DOMAIN-SUFFIX,duokan.com,DIRECT
  - DOMAIN-SUFFIX,easou.com,DIRECT
  - DOMAIN-SUFFIX,ele.me,DIRECT
  - DOMAIN-SUFFIX,feng.com,DIRECT
  - DOMAIN-SUFFIX,fir.im,DIRECT
  - DOMAIN-SUFFIX,frdic.com,DIRECT
  - DOMAIN-SUFFIX,g-cores.com,DIRECT
  - DOMAIN-SUFFIX,godic.net,DIRECT
  - DOMAIN-SUFFIX,gtimg.com,DIRECT
  - DOMAIN-SUFFIX,hongxiu.com,DIRECT
  - DOMAIN-SUFFIX,hxcdn.net,DIRECT
  - DOMAIN-SUFFIX,iciba.com,DIRECT
  - DOMAIN-SUFFIX,ifeng.com,DIRECT
  - DOMAIN-SUFFIX,ifengimg.com,DIRECT
  - DOMAIN-SUFFIX,ipip.net,DIRECT
  - DOMAIN-SUFFIX,iqiyi.com,DIRECT
  - DOMAIN-SUFFIX,jd.com,DIRECT
  - DOMAIN-SUFFIX,jianshu.com,DIRECT
  - DOMAIN-SUFFIX,knewone.com,DIRECT
  - DOMAIN-SUFFIX,le.com,DIRECT
  - DOMAIN-SUFFIX,lecloud.com,DIRECT
  - DOMAIN-SUFFIX,lemicp.com,DIRECT
  - DOMAIN-SUFFIX,licdn.com,DIRECT
  - DOMAIN-SUFFIX,luoo.net,DIRECT
  - DOMAIN-SUFFIX,meituan.com,DIRECT
  - DOMAIN-SUFFIX,meituan.net,DIRECT
  - DOMAIN-SUFFIX,mi.com,DIRECT
  - DOMAIN-SUFFIX,miaopai.com,DIRECT
  - DOMAIN-SUFFIX,microsoft.com,DIRECT
  - DOMAIN-SUFFIX,microsoftonline.com,DIRECT
  - DOMAIN-SUFFIX,miui.com,DIRECT
  - DOMAIN-SUFFIX,miwifi.com,DIRECT
  - DOMAIN-SUFFIX,mob.com,DIRECT
  - DOMAIN-SUFFIX,netease.com,DIRECT
  - DOMAIN-SUFFIX,office.com,DIRECT
  - DOMAIN-KEYWORD,officecdn,DIRECT
  - DOMAIN-SUFFIX,office365.com,DIRECT
  - DOMAIN-SUFFIX,oschina.net,DIRECT
  - DOMAIN-SUFFIX,ppsimg.com,DIRECT
  - DOMAIN-SUFFIX,pstatp.com,DIRECT
  - DOMAIN-SUFFIX,qcloud.com,DIRECT
  - DOMAIN-SUFFIX,qdaily.com,DIRECT
  - DOMAIN-SUFFIX,qdmm.com,DIRECT
  - DOMAIN-SUFFIX,qhimg.com,DIRECT
  - DOMAIN-SUFFIX,qhres.com,DIRECT
  - DOMAIN-SUFFIX,qidian.com,DIRECT
  - DOMAIN-SUFFIX,qihucdn.com,DIRECT
  - DOMAIN-SUFFIX,qiniu.com,DIRECT
  - DOMAIN-SUFFIX,qiniucdn.com,DIRECT
  - DOMAIN-SUFFIX,qiyipic.com,DIRECT
  - DOMAIN-SUFFIX,qq.com,DIRECT
  - DOMAIN-SUFFIX,qqurl.com,DIRECT
  - DOMAIN-SUFFIX,rarbg.to,DIRECT
  - DOMAIN-SUFFIX,ruguoapp.com,DIRECT
  - DOMAIN-SUFFIX,segmentfault.com,DIRECT
  - DOMAIN-SUFFIX,sinaapp.com,DIRECT
  - DOMAIN-SUFFIX,smzdm.com,DIRECT
  - DOMAIN-SUFFIX,sogou.com,DIRECT
  - DOMAIN-SUFFIX,sogoucdn.com,DIRECT
  - DOMAIN-SUFFIX,sohu.com,DIRECT
  - DOMAIN-SUFFIX,soku.com,DIRECT
  - DOMAIN-SUFFIX,speedtest.net,DIRECT
  - DOMAIN-SUFFIX,sspai.com,DIRECT
  - DOMAIN-SUFFIX,suning.com,DIRECT
  - DOMAIN-SUFFIX,taobao.com,DIRECT
  - DOMAIN-SUFFIX,tencent.com,DIRECT
  - DOMAIN-SUFFIX,tenpay.com,DIRECT
  - DOMAIN-SUFFIX,tianyancha.com,DIRECT
  - DOMAIN-SUFFIX,tmall.com,DIRECT
  - DOMAIN-SUFFIX,tudou.com,DIRECT
  - DOMAIN-SUFFIX,umetrip.com,DIRECT
  - DOMAIN-SUFFIX,upaiyun.com,DIRECT
  - DOMAIN-SUFFIX,upyun.com,DIRECT
  - DOMAIN-SUFFIX,veryzhun.com,DIRECT
  - DOMAIN-SUFFIX,weather.com,DIRECT
  - DOMAIN-SUFFIX,weibo.com,DIRECT
  - DOMAIN-SUFFIX,xiami.com,DIRECT
  - DOMAIN-SUFFIX,xiami.net,DIRECT
  - DOMAIN-SUFFIX,xiaomicp.com,DIRECT
  - DOMAIN-SUFFIX,ximalaya.com,DIRECT
  - DOMAIN-SUFFIX,xmcdn.com,DIRECT
  - DOMAIN-SUFFIX,xunlei.com,DIRECT
  - DOMAIN-SUFFIX,yhd.com,DIRECT
  - DOMAIN-SUFFIX,yihaodianimg.com,DIRECT
  - DOMAIN-SUFFIX,yinxiang.com,DIRECT
  - DOMAIN-SUFFIX,ykimg.com,DIRECT
  - DOMAIN-SUFFIX,youdao.com,DIRECT
  - DOMAIN-SUFFIX,youku.com,DIRECT
  - DOMAIN-SUFFIX,zealer.com,DIRECT
  - DOMAIN-SUFFIX,zhihu.com,DIRECT
  - DOMAIN-SUFFIX,zhimg.com,DIRECT
  - DOMAIN-SUFFIX,zimuzu.tv,DIRECT
  - DOMAIN-KEYWORD,netflix,代理组名称
  - DOMAIN-KEYWORD,nflx,代理组名称
  ## 抗 DNS 污染
  - DOMAIN-KEYWORD,amazon,代理组名称
  - DOMAIN-KEYWORD,google,代理组名称
  - DOMAIN-KEYWORD,gmail,代理组名称
  - DOMAIN-KEYWORD,youtube,代理组名称
  - DOMAIN-KEYWORD,facebook,代理组名称
  - DOMAIN-SUFFIX,fb.me,代理组名称
  - DOMAIN-SUFFIX,fbcdn.net,代理组名称
  - DOMAIN-KEYWORD,twitter,代理组名称
  - DOMAIN-KEYWORD,instagram,代理组名称
  - DOMAIN-KEYWORD,dropbox,代理组名称
  - DOMAIN-SUFFIX,twimg.com,代理组名称
  - DOMAIN-KEYWORD,blogspot,代理组名称
  - DOMAIN-SUFFIX,youtu.be,代理组名称
  - DOMAIN-KEYWORD,whatsapp,代理组名称
  - DOMAIN-KEYWORD,googleapis,代理组名称
  # Clubhouse
  - DOMAIN-SUFFIX,clubhouse.com,代理组名称
  - DOMAIN-SUFFIX,clubhouseapi.com,代理组名称
  - DOMAIN-SUFFIX,joinclubhouse.com,代理组名称
  - DOMAIN-SUFFIX,clubhouseprod.s3.amazonaws.com,代理组名称
  - DOMAIN-SUFFIX,clubhouse.pubnub.com,代理组名称

  - DOMAIN-SUFFIX, ap-oversea-tls.agora.io, DIRECT
  - DOMAIN-SUFFIX, ap-oversea.agora.io, DIRECT
  - DOMAIN-SUFFIX, ap-oversea2.agora.io, DIRECT
  - DOMAIN-SUFFIX, report-oversea.agora.io, DIRECT
  - IP-CIDR, 3.0.163.78/32, DIRECT
  - IP-CIDR, 13.230.60.35/32, DIRECT
  - IP-CIDR, 23.248.191.103/32, DIRECT
  - IP-CIDR, 23.248.191.105/32, DIRECT
  - IP-CIDR, 23.98.43.152/32, DIRECT
  - IP-CIDR, 35.178.208.187/32, DIRECT
  - IP-CIDR, 45.40.48.11/32, DIRECT
  - IP-CIDR, 45.255.124.98/32, DIRECT
  - IP-CIDR, 45.255.124.100/32, DIRECT
  - IP-CIDR, 45.255.124.101/32, DIRECT
  - IP-CIDR, 45.255.124.104/32, DIRECT
  - IP-CIDR, 45.255.124.105/32, DIRECT
  - IP-CIDR, 45.255.124.107/32, DIRECT
  - IP-CIDR, 45.255.124.108/32, DIRECT
  - IP-CIDR, 45.255.124.109/32, DIRECT
  - IP-CIDR, 45.255.124.135/32, DIRECT
  - IP-CIDR, 50.17.126.121/32, DIRECT
  - IP-CIDR, 52.52.84.170/32, DIRECT
  - IP-CIDR, 52.58.56.244/32, DIRECT
  - IP-CIDR, 52.194.158.59/32, DIRECT
  - IP-CIDR, 52.221.46.208/32, DIRECT
  - IP-CIDR, 54.178.26.110/32, DIRECT
  - IP-CIDR, 69.28.51.148/32, DIRECT
  - IP-CIDR, 103.59.49.10/32, DIRECT
  - IP-CIDR, 103.65.41.166/32, DIRECT
  - IP-CIDR, 103.65.41.169/32, DIRECT
  - IP-CIDR, 103.98.18.181/32, DIRECT
  - IP-CIDR, 103.98.18.183/32, DIRECT
  - IP-CIDR, 103.98.18.184/32, DIRECT
  - IP-CIDR, 103.98.18.189/32, DIRECT
  - IP-CIDR, 120.227.115.126/32, DIRECT
  - IP-CIDR, 122.10.255.165/32, DIRECT
  - IP-CIDR, 128.1.87.196/32, DIRECT
  - IP-CIDR, 129.227.71.203/32, DIRECT
  - IP-CIDR, 129.227.115.130/32, DIRECT
  - IP-CIDR, 148.153.126.146/32, DIRECT
  - IP-CIDR, 148.153.172.73/32, DIRECT
  - IP-CIDR, 148.153.172.74/32, DIRECT
  - IP-CIDR, 148.153.172.75/32, DIRECT
  - IP-CIDR, 148.153.172.76/32, DIRECT
  - IP-CIDR, 148.153.172.77/32, DIRECT
  - IP-CIDR, 164.52.0.244/32, DIRECT
  - IP-CIDR, 164.52.6.19/32, DIRECT
  - IP-CIDR, 164.52.6.21/32, DIRECT
  - IP-CIDR, 164.52.6.23/32, DIRECT
  - IP-CIDR, 164.52.6.24/32, DIRECT
  - IP-CIDR, 164.52.6.25/32, DIRECT
  - IP-CIDR, 164.52.32.57/32, DIRECT
  - IP-CIDR, 164.52.32.59/32, DIRECT
  - IP-CIDR, 164.52.32.60/32, DIRECT
  - IP-CIDR, 164.52.36.228/32, DIRECT
  - IP-CIDR, 164.52.36.232/32, DIRECT
  - IP-CIDR, 164.52.36.238/32, DIRECT
  - IP-CIDR, 164.52.36.243/32, DIRECT
  - IP-CIDR, 164.52.36.245/32, DIRECT
  - IP-CIDR, 164.52.36.254/32, DIRECT
  - IP-CIDR, 164.52.102.35/32, DIRECT
  - IP-CIDR, 164.52.102.66/32, DIRECT
  - IP-CIDR, 164.52.102.67/32, DIRECT
  - IP-CIDR, 164.52.102.68/32, DIRECT
  - IP-CIDR, 164.52.102.69/32, DIRECT
  - IP-CIDR, 164.52.102.70/32, DIRECT
  - IP-CIDR, 164.52.102.75/32, DIRECT
  - IP-CIDR, 164.52.102.76/32, DIRECT
  - IP-CIDR, 164.52.102.77/32, DIRECT
  - IP-CIDR, 164.52.102.91/32, DIRECT
  - IP-CIDR, 164.52.124.102/32, DIRECT
  - IP-CIDR, 199.190.44.36/32, DIRECT
  - IP-CIDR, 199.190.44.37/32, DIRECT
  - IP-CIDR, 202.181.136.106/32, DIRECT
  - IP-CIDR, 202.226.25.162/32, DIRECT
  - IP-CIDR, 202.226.25.166/32, DIRECT
  - IP-CIDR, 202.226.25.171/32, DIRECT
  - IP-CIDR, 202.226.25.195/32, DIRECT
  - IP-CIDR, 202.226.25.198/32, DIRECT
  - IP-CIDR, 129.227.57.143/32, DIRECT
  - IP-CIDR, 129.227.234.70/32, DIRECT
  - IP-CIDR, 129.227.234.82/32, DIRECT
  - IP-CIDR, 129.227.234.119/32, DIRECT
  - IP-CIDR, 129.227.71.144/32, DIRECT
  - IP-CIDR, 129.227.57.132/32, DIRECT
  - IP-CIDR, 129.227.57.134/32, DIRECT
  - IP-CIDR, 129.227.57.145/32, DIRECT
  - IP-CIDR, 129.227.71.141/32, DIRECT
  - IP-CIDR, 129.227.234.83/32, DIRECT
  - IP-CIDR, 129.227.71.142/32, DIRECT
  - IP-CIDR, 129.227.71.132/32, DIRECT
  - IP-CIDR, 129.227.71.133/32, DIRECT
  - IP-CIDR, 129.227.71.134/32, DIRECT
  - IP-CIDR, 129.227.234.67/32, DIRECT
  - IP-CIDR, 129.227.234.110/32, DIRECT
  - IP-CIDR, 129.227.234.112/32, DIRECT
  - IP-CIDR, 129.227.234.124/32, DIRECT
  - IP-CIDR, 129.227.71.140/32, DIRECT
  - IP-CIDR, 129.227.71.130/32, DIRECT
  - IP-CIDR, 129.227.71.131/32, DIRECT
  - IP-CIDR, 129.227.71.143/32, DIRECT
  - IP-CIDR, 129.227.156.17/32, DIRECT
  - IP-CIDR, 129.227.57.137/32, DIRECT
  - IP-CIDR, 129.227.156.20/32, DIRECT
  ## 国外网站
  - DOMAIN-SUFFIX,openai.com,代理组名称
  - DOMAIN-SUFFIX,9to5mac.com,代理组名称
  - DOMAIN-SUFFIX,abpchina.org,代理组名称
  - DOMAIN-SUFFIX,adblockplus.org,代理组名称
  - DOMAIN-SUFFIX,adobe.com,代理组名称
  - DOMAIN-SUFFIX,alfredapp.com,代理组名称
  - DOMAIN-SUFFIX,amplitude.com,代理组名称
  - DOMAIN-SUFFIX,ampproject.org,代理组名称
  - DOMAIN-SUFFIX,android.com,代理组名称
  - DOMAIN-SUFFIX,angularjs.org,代理组名称
  - DOMAIN-SUFFIX,aolcdn.com,代理组名称
  - DOMAIN-SUFFIX,apkpure.com,代理组名称
  - DOMAIN-SUFFIX,appledaily.com,代理组名称
  - DOMAIN-SUFFIX,appshopper.com,代理组名称
  - DOMAIN-SUFFIX,appspot.com,代理组名称
  - DOMAIN-SUFFIX,arcgis.com,代理组名称
  - DOMAIN-SUFFIX,archive.org,代理组名称
  - DOMAIN-SUFFIX,armorgames.com,代理组名称
  - DOMAIN-SUFFIX,aspnetcdn.com,代理组名称
  - DOMAIN-SUFFIX,att.com,代理组名称
  - DOMAIN-SUFFIX,awsstatic.com,代理组名称
  - DOMAIN-SUFFIX,azureedge.net,代理组名称
  - DOMAIN-SUFFIX,azurewebsites.net,代理组名称
  - DOMAIN-SUFFIX,bing.com,代理组名称
  - DOMAIN-SUFFIX,bintray.com,代理组名称
  - DOMAIN-SUFFIX,bit.com,代理组名称
  - DOMAIN-SUFFIX,bit.ly,代理组名称
  - DOMAIN-SUFFIX,bitbucket.org,代理组名称
  - DOMAIN-SUFFIX,bjango.com,代理组名称
  - DOMAIN-SUFFIX,bkrtx.com,代理组名称
  - DOMAIN-SUFFIX,blog.com,代理组名称
  - DOMAIN-SUFFIX,blogcdn.com,代理组名称
  - DOMAIN-SUFFIX,blogger.com,代理组名称
  - DOMAIN-SUFFIX,blogsmithmedia.com,代理组名称
  - DOMAIN-SUFFIX,blogspot.com,代理组名称
  - DOMAIN-SUFFIX,blogspot.hk,代理组名称
  - DOMAIN-SUFFIX,bloomberg.com,代理组名称
  - DOMAIN-SUFFIX,box.com,代理组名称
  - DOMAIN-SUFFIX,box.net,代理组名称
  - DOMAIN-SUFFIX,cachefly.net,代理组名称
  - DOMAIN-SUFFIX,chromium.org,代理组名称
  - DOMAIN-SUFFIX,cl.ly,代理组名称
  - DOMAIN-SUFFIX,cloudflare.com,代理组名称
  - DOMAIN-SUFFIX,cloudfront.net,代理组名称
  - DOMAIN-SUFFIX,cloudmagic.com,代理组名称
  - DOMAIN-SUFFIX,cmail19.com,代理组名称
  - DOMAIN-SUFFIX,cnet.com,代理组名称
  - DOMAIN-SUFFIX,cocoapods.org,代理组名称
  - DOMAIN-SUFFIX,comodoca.com,代理组名称
  - DOMAIN-SUFFIX,crashlytics.com,代理组名称
  - DOMAIN-SUFFIX,culturedcode.com,代理组名称
  - DOMAIN-SUFFIX,d.pr,代理组名称
  - DOMAIN-SUFFIX,danilo.to,代理组名称
  - DOMAIN-SUFFIX,dayone.me,代理组名称
  - DOMAIN-SUFFIX,db.tt,代理组名称
  - DOMAIN-SUFFIX,deskconnect.com,代理组名称
  - DOMAIN-SUFFIX,disq.us,代理组名称
  - DOMAIN-SUFFIX,disqus.com,代理组名称
  - DOMAIN-SUFFIX,disquscdn.com,代理组名称
  - DOMAIN-SUFFIX,dnsimple.com,代理组名称
  - DOMAIN-SUFFIX,docker.com,代理组名称
  - DOMAIN-SUFFIX,dribbble.com,代理组名称
  - DOMAIN-SUFFIX,droplr.com,代理组名称
  - DOMAIN-SUFFIX,duckduckgo.com,代理组名称
  - DOMAIN-SUFFIX,dueapp.com,代理组名称
  - DOMAIN-SUFFIX,dytt8.net,代理组名称
  - DOMAIN-SUFFIX,edgecastcdn.net,代理组名称
  - DOMAIN-SUFFIX,edgekey.net,代理组名称
  - DOMAIN-SUFFIX,edgesuite.net,代理组名称
  - DOMAIN-SUFFIX,engadget.com,代理组名称
  - DOMAIN-SUFFIX,entrust.net,代理组名称
  - DOMAIN-SUFFIX,eurekavpt.com,代理组名称
  - DOMAIN-SUFFIX,evernote.com,代理组名称
  - DOMAIN-SUFFIX,fabric.io,代理组名称
  - DOMAIN-SUFFIX,fast.com,代理组名称
  - DOMAIN-SUFFIX,fastly.net,代理组名称
  - DOMAIN-SUFFIX,fc2.com,代理组名称
  - DOMAIN-SUFFIX,feedburner.com,代理组名称
  - DOMAIN-SUFFIX,feedly.com,代理组名称
  - DOMAIN-SUFFIX,feedsportal.com,代理组名称
  - DOMAIN-SUFFIX,fiftythree.com,代理组名称
  - DOMAIN-SUFFIX,firebaseio.com,代理组名称
  - DOMAIN-SUFFIX,flexibits.com,代理组名称
  - DOMAIN-SUFFIX,flickr.com,代理组名称
  - DOMAIN-SUFFIX,flipboard.com,代理组名称
  - DOMAIN-SUFFIX,g.co,代理组名称
  - DOMAIN-SUFFIX,gabia.net,代理组名称
  - DOMAIN-SUFFIX,geni.us,代理组名称
  - DOMAIN-SUFFIX,gfx.ms,代理组名称
  - DOMAIN-SUFFIX,ggpht.com,代理组名称
  - DOMAIN-SUFFIX,ghostnoteapp.com,代理组名称
  - DOMAIN-SUFFIX,git.io,代理组名称
  - DOMAIN-KEYWORD,github,代理组名称
  - DOMAIN-KEYWORD,linkedin,代理组名称
  - DOMAIN-SUFFIX,globalsign.com,代理组名称
  - DOMAIN-SUFFIX,gmodules.com,代理组名称
  - DOMAIN-SUFFIX,godaddy.com,代理组名称
  - DOMAIN-SUFFIX,golang.org,代理组名称
  - DOMAIN-SUFFIX,gongm.in,代理组名称
  - DOMAIN-SUFFIX,goo.gl,代理组名称
  - DOMAIN-SUFFIX,goodreaders.com,代理组名称
  - DOMAIN-SUFFIX,goodreads.com,代理组名称
  - DOMAIN-SUFFIX,gravatar.com,代理组名称
  - DOMAIN-SUFFIX,gstatic.com,代理组名称
  - DOMAIN-SUFFIX,gvt0.com,代理组名称
  - DOMAIN-SUFFIX,hockeyapp.net,代理组名称
  - DOMAIN-SUFFIX,hotmail.com,代理组名称
  - DOMAIN-SUFFIX,icons8.com,代理组名称
  - DOMAIN-SUFFIX,ift.tt,代理组名称
  - DOMAIN-SUFFIX,ifttt.com,代理组名称
  - DOMAIN-SUFFIX,iherb.com,代理组名称
  - DOMAIN-SUFFIX,imageshack.us,代理组名称
  - DOMAIN-SUFFIX,img.ly,代理组名称
  - DOMAIN-SUFFIX,imgur.com,代理组名称
  - DOMAIN-SUFFIX,imore.com,代理组名称
  - DOMAIN-SUFFIX,instapaper.com,代理组名称
  - DOMAIN-SUFFIX,ipn.li,代理组名称
  - DOMAIN-SUFFIX,is.gd,代理组名称
  - DOMAIN-SUFFIX,issuu.com,代理组名称
  - DOMAIN-SUFFIX,itgonglun.com,代理组名称
  - DOMAIN-SUFFIX,itun.es,代理组名称
  - DOMAIN-SUFFIX,ixquick.com,代理组名称
  - DOMAIN-SUFFIX,j.mp,代理组名称
  - DOMAIN-SUFFIX,js.revsci.net,代理组名称
  - DOMAIN-SUFFIX,jshint.com,代理组名称
  - DOMAIN-SUFFIX,jtvnw.net,代理组名称
  - DOMAIN-SUFFIX,justgetflux.com,代理组名称
  - DOMAIN-SUFFIX,kat.cr,代理组名称
  - DOMAIN-SUFFIX,klip.me,代理组名称
  - DOMAIN-SUFFIX,libsyn.com,代理组名称
  - DOMAIN-SUFFIX,linode.com,代理组名称
  - DOMAIN-SUFFIX,lithium.com,代理组名称
  - DOMAIN-SUFFIX,littlehj.com,代理组名称
  - DOMAIN-SUFFIX,live.com,代理组名称
  - DOMAIN-SUFFIX,live.net,代理组名称
  - DOMAIN-SUFFIX,livefilestore.com,代理组名称
  - DOMAIN-SUFFIX,llnwd.net,代理组名称
  - DOMAIN-SUFFIX,macid.co,代理组名称
  - DOMAIN-SUFFIX,macromedia.com,代理组名称
  - DOMAIN-SUFFIX,macrumors.com,代理组名称
  - DOMAIN-SUFFIX,mashable.com,代理组名称
  - DOMAIN-SUFFIX,mathjax.org,代理组名称
  - DOMAIN-SUFFIX,medium.com,代理组名称
  - DOMAIN-SUFFIX,mega.co.nz,代理组名称
  - DOMAIN-SUFFIX,mega.nz,代理组名称
  - DOMAIN-SUFFIX,megaupload.com,代理组名称
  - DOMAIN-SUFFIX,microsofttranslator.com,代理组名称
  - DOMAIN-SUFFIX,mindnode.com,代理组名称
  - DOMAIN-SUFFIX,mobile01.com,代理组名称
  - DOMAIN-SUFFIX,modmyi.com,代理组名称
  - DOMAIN-SUFFIX,msedge.net,代理组名称
  - DOMAIN-SUFFIX,myfontastic.com,代理组名称
  - DOMAIN-SUFFIX,name.com,代理组名称
  - DOMAIN-SUFFIX,nextmedia.com,代理组名称
  - DOMAIN-SUFFIX,nsstatic.net,代理组名称
  - DOMAIN-SUFFIX,nssurge.com,代理组名称
  - DOMAIN-SUFFIX,nyt.com,代理组名称
  - DOMAIN-SUFFIX,nytimes.com,代理组名称
  - DOMAIN-SUFFIX,omnigroup.com,代理组名称
  - DOMAIN-SUFFIX,onedrive.com,代理组名称
  - DOMAIN-SUFFIX,onenote.com,代理组名称
  - DOMAIN-SUFFIX,ooyala.com,代理组名称
  - DOMAIN-SUFFIX,openvpn.net,代理组名称
  - DOMAIN-SUFFIX,openwrt.org,代理组名称
  - DOMAIN-SUFFIX,orkut.com,代理组名称
  - DOMAIN-SUFFIX,osxdaily.com,代理组名称
  - DOMAIN-SUFFIX,outlook.com,代理组名称
  - DOMAIN-SUFFIX,ow.ly,代理组名称
  - DOMAIN-SUFFIX,paddleapi.com,代理组名称
  - DOMAIN-SUFFIX,parallels.com,代理组名称
  - DOMAIN-SUFFIX,parse.com,代理组名称
  - DOMAIN-SUFFIX,pdfexpert.com,代理组名称
  - DOMAIN-SUFFIX,periscope.tv,代理组名称
  - DOMAIN-SUFFIX,pinboard.in,代理组名称
  - DOMAIN-SUFFIX,pinterest.com,代理组名称
  - DOMAIN-SUFFIX,pixelmator.com,代理组名称
  - DOMAIN-SUFFIX,pixiv.net,代理组名称
  - DOMAIN-SUFFIX,playpcesor.com,代理组名称
  - DOMAIN-SUFFIX,playstation.com,代理组名称
  - DOMAIN-SUFFIX,playstation.com.hk,代理组名称
  - DOMAIN-SUFFIX,playstation.net,代理组名称
  - DOMAIN-SUFFIX,playstationnetwork.com,代理组名称
  - DOMAIN-SUFFIX,pushwoosh.com,代理组名称
  - DOMAIN-SUFFIX,rime.im,代理组名称
  - DOMAIN-SUFFIX,servebom.com,代理组名称
  - DOMAIN-SUFFIX,sfx.ms,代理组名称
  - DOMAIN-SUFFIX,shadowsocks.org,代理组名称
  - DOMAIN-SUFFIX,sharethis.com,代理组名称
  - DOMAIN-SUFFIX,shazam.com,代理组名称
  - DOMAIN-SUFFIX,skype.com,代理组名称
  - DOMAIN-SUFFIX,smartdnsProxy.com,代理组名称
  - DOMAIN-SUFFIX,smartmailcloud.com,代理组名称
  - DOMAIN-SUFFIX,sndcdn.com,代理组名称
  - DOMAIN-SUFFIX,sony.com,代理组名称
  - DOMAIN-SUFFIX,soundcloud.com,代理组名称
  - DOMAIN-SUFFIX,sourceforge.net,代理组名称
  - DOMAIN-SUFFIX,spotify.com,代理组名称
  - DOMAIN-SUFFIX,squarespace.com,代理组名称
  - DOMAIN-SUFFIX,sstatic.net,代理组名称
  - DOMAIN-SUFFIX,st.luluku.pw,代理组名称
  - DOMAIN-SUFFIX,stackoverflow.com,代理组名称
  - DOMAIN-SUFFIX,startpage.com,代理组名称
  - DOMAIN-SUFFIX,staticflickr.com,代理组名称
  - DOMAIN-SUFFIX,steamcommunity.com,代理组名称
  - DOMAIN-SUFFIX,symauth.com,代理组名称
  - DOMAIN-SUFFIX,symcb.com,代理组名称
  - DOMAIN-SUFFIX,symcd.com,代理组名称
  - DOMAIN-SUFFIX,tapbots.com,代理组名称
  - DOMAIN-SUFFIX,tapbots.net,代理组名称
  - DOMAIN-SUFFIX,tdesktop.com,代理组名称
  - DOMAIN-SUFFIX,techcrunch.com,代理组名称
  - DOMAIN-SUFFIX,techsmith.com,代理组名称
  - DOMAIN-SUFFIX,thepiratebay.org,代理组名称
  - DOMAIN-SUFFIX,theverge.com,代理组名称
  - DOMAIN-SUFFIX,time.com,代理组名称
  - DOMAIN-SUFFIX,timeinc.net,代理组名称
  - DOMAIN-SUFFIX,tiny.cc,代理组名称
  - DOMAIN-SUFFIX,tinypic.com,代理组名称
  - DOMAIN-SUFFIX,tmblr.co,代理组名称
  - DOMAIN-SUFFIX,todoist.com,代理组名称
  - DOMAIN-SUFFIX,trello.com,代理组名称
  - DOMAIN-SUFFIX,trustasiassl.com,代理组名称
  - DOMAIN-SUFFIX,tumblr.co,代理组名称
  - DOMAIN-SUFFIX,tumblr.com,代理组名称
  - DOMAIN-SUFFIX,tweetdeck.com,代理组名称
  - DOMAIN-SUFFIX,tweetmarker.net,代理组名称
  - DOMAIN-SUFFIX,twitch.tv,代理组名称
  - DOMAIN-SUFFIX,txmblr.com,代理组名称
  - DOMAIN-SUFFIX,typekit.net,代理组名称
  - DOMAIN-SUFFIX,ubertags.com,代理组名称
  - DOMAIN-SUFFIX,ublock.org,代理组名称
  - DOMAIN-SUFFIX,ubnt.com,代理组名称
  - DOMAIN-SUFFIX,ulyssesapp.com,代理组名称
  - DOMAIN-SUFFIX,urchin.com,代理组名称
  - DOMAIN-SUFFIX,usertrust.com,代理组名称
  - DOMAIN-SUFFIX,v.gd,代理组名称
  - DOMAIN-SUFFIX,vimeo.com,代理组名称
  - DOMAIN-SUFFIX,vimeocdn.com,代理组名称
  - DOMAIN-SUFFIX,vine.co,代理组名称
  - DOMAIN-SUFFIX,vivaldi.com,代理组名称
  - DOMAIN-SUFFIX,vox-cdn.com,代理组名称
  - DOMAIN-SUFFIX,vsco.co,代理组名称
  - DOMAIN-SUFFIX,vultr.com,代理组名称
  - DOMAIN-SUFFIX,w.org,代理组名称
  - DOMAIN-SUFFIX,w3schools.com,代理组名称
  - DOMAIN-SUFFIX,webtype.com,代理组名称
  - DOMAIN-SUFFIX,wikiwand.com,代理组名称
  - DOMAIN-SUFFIX,wikileaks.org,代理组名称
  - DOMAIN-SUFFIX,wikimedia.org,代理组名称
  - DOMAIN-SUFFIX,wikipedia.com,代理组名称
  - DOMAIN-SUFFIX,wikipedia.org,代理组名称
  - DOMAIN-SUFFIX,windows.com,代理组名称
  - DOMAIN-SUFFIX,windows.net,代理组名称
  - DOMAIN-SUFFIX,wire.com,代理组名称
  - DOMAIN-SUFFIX,wordpress.com,代理组名称
  - DOMAIN-SUFFIX,workflowy.com,代理组名称
  - DOMAIN-SUFFIX,wp.com,代理组名称
  - DOMAIN-SUFFIX,wsj.com,代理组名称
  - DOMAIN-SUFFIX,wsj.net,代理组名称
  - DOMAIN-SUFFIX,xda-developers.com,代理组名称
  - DOMAIN-SUFFIX,xeeno.com,代理组名称
  - DOMAIN-SUFFIX,xiti.com,代理组名称
  - DOMAIN-SUFFIX,yahoo.com,代理组名称
  - DOMAIN-SUFFIX,yimg.com,代理组名称
  - DOMAIN-SUFFIX,ying.com,代理组名称
  - DOMAIN-SUFFIX,yoyo.org,代理组名称
  - DOMAIN-SUFFIX,ytimg.com,代理组名称
  - DOMAIN-SUFFIX,telegram.me,代理组名称
  - DOMAIN-SUFFIX,v2ex.com,代理组名称
  - DOMAIN-SUFFIX,poe.com,代理组名称
  - DOMAIN-SUFFIX,poecdn.net,代理组名称
  - DOMAIN-SUFFIX,quoracdn.net,代理组名称
  - IP-CIDR,91.108.4.0/22,代理组名称
  - IP-CIDR,91.108.8.0/22,代理组名称
  - IP-CIDR,91.108.56.0/22,代理组名称
  - IP-CIDR,109.239.140.0/24,代理组名称
  - IP-CIDR,149.154.160.0/20,代理组名称
  - IP-CIDR,127.0.0.0/8,DIRECT
  - IP-CIDR,172.16.0.0/12,DIRECT
  - IP-CIDR,192.168.0.0/16,DIRECT
  - IP-CIDR,10.0.0.0/8,DIRECT
  - IP-CIDR,17.0.0.0/8,DIRECT
  - IP-CIDR,100.64.0.0/10,DIRECT
  - GEOIP,CN,DIRECT
  - MATCH,代理组名称
```

实际使用的时候只需要把服务器信息填进去即可。

---

## 一点总结

这次折腾其实也算是一个小小的教训：很多时候我们用一套方案久了，就很少再去关注新的技术变化。

从 Shadowsocks 到 Xray 的 Reality，其实整个代理技术这几年变化还挺大的。

Reality 的思路本质上是让流量看起来更像正常的 TLS 连接，从而降低被识别的概率。配置虽然比早期的 Shadowsocks 稍微复杂一点，但整体来说稳定性确实更好。

当然，对大多数人来说，可能直接使用现成服务会更省事。但如果像我一样喜欢折腾服务器，这种自己一步步搭起来的过程，其实也挺有意思的。

至少下次再遇到问题的时候，大概也知道该从哪里开始排查了。

‍
