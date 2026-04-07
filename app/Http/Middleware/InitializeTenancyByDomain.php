<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain as BaseMiddleware;
use Symfony\Component\HttpFoundation\Response;

class InitializeTenancyByDomain extends BaseMiddleware
{
    // Inherits from stancl/tenancy base middleware
    // Override onFail to return JSON for API routes
    public static $onFail = null;
}
