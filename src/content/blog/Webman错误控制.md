---
title: 'Webman 错误控制'
publishDate: '2024-10-04 15:49:36'
description: '在本文中，我们探讨了如何在 PHP 的 Webman 框架中通过继承 ExceptionHandlerInterface 自定义错误处理类'
tags:
  - PHP
  - Webman
language: '中文'
heroImage: { src: './cover/php.png', color: '#573ba2' }
draft: false
slug: '8f2a61e0'
---

在 Webman 中，控制错误返回可以通过全局异常处理器（`ExceptionHandler`）来处理。你可以自定义异常处理逻辑，根据不同的异常类型或错误，返回不同的 HTTP 响应状态码和错误信息。以下是一个实现方式的示例：

## 自定义全局异常处理器

你可以定义自己的异常处理器，例如创建一个 `app/exception/Handler.php` ，继承 Webman 提供的 `ExceptionHandlerInterface`：

```php
<?php
namespace app\exception;

use Throwable;
use Webman\Http\Response;
use Webman\Http\Request;
use Webman\Exception\ExceptionHandlerInterface;

class Handler implements ExceptionHandlerInterface
{
    // 定义不需要记录日志的异常类型
    public $dontReport = [
        // 在这里可以定义不需要记录日志的异常类型
        \Illuminate\Validation\ValidationException::class,
        // 例如自定义业务逻辑异常
        \app\exception\BusinessException::class,
    ];

    /**
     * 处理异常的方法
     *
     * @param Request $request
     * @param Throwable $exception
     * @return Response
     */
    public function render(Request $request, Throwable $exception): Response
    {
        // 检查是否为自定义的业务异常
        if ($exception instanceof \app\exception\BusinessException) {
            return response(json(['error' => $exception->getMessage()], 400));
        }

        // 默认返回500错误
        return response(json(['error' => 'Server Error'], 500));
    }

    /**
     * 记录异常日志的方法
     *
     * @param Throwable $exception
     * @return void
     */
    public function report(Throwable $exception)
    {
        // 如果异常不在 dontReport 中，就记录日志
        if (!$this->shouldntReport($exception)) {
            echo $exception; // 这里可以使用你喜欢的日志系统记录错误
        }
    }

    /**
     * 判断是否应该记录异常
     *
     * @param Throwable $exception
     * @return bool
     */
    protected function shouldntReport(Throwable $exception): bool
    {
        foreach ($this->dontReport as $type) {
            if ($exception instanceof $type) {
                return true;
            }
        }
        return false;
    }
}

```

## 在配置文件中指定异常处理器

在 `config/exception.php` 中，你可以指定这个异常处理器：

```php
return [
    'exception_handler' => app\exception\Handler::class,
];
```

## 自定义异常类

你可以根据需求定义自己的业务异常类，例如：

```php
<?php
namespace app\exception;

use Exception;

class BusinessException extends Exception
{
    public function __construct($message = "业务逻辑异常", $code = 400)
    {
        parent::__construct($message, $code);
    }
}

```

## 返回自定义错误响应

当某个操作出现业务错误时，你可以抛出自定义异常，比如：

```php
use app\exception\BusinessException;

throw new BusinessException("自定义的业务错误信息", 400);

```

这样，Webman 会根据你在全局异常处理器中定义的逻辑，返回相应的错误信息和 HTTP 状态码。

## 总结

通过自定义全局异常处理器，你可以灵活地控制 Webman 应用中的错误返回，能够根据不同的异常类型返回不同的错误信息，并记录相应的日志。
