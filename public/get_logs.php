<?php header("Content-Type: text/plain"); if(!file_exists("../storage/logs/laravel.log")) { echo "No log"; exit; } echo implode("", array_slice(file("../storage/logs/laravel.log"), -500)); ?>
