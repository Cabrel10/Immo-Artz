<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Carbon;

abstract class TestCase extends BaseTestCase
{
    /**
     * Freeze time at a known instant for all tests.
     * This eliminates race conditions on time-dependent assertions
     * (catalog password validity, payment auto-complete, rate limiting).
     *
     * We use the app timezone (Africa/Douala) to avoid TZ mismatches
     * when datetime values are stored/read back from SQLite.
     */
    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::create(2026, 6, 3, 12, 0, 0, config('app.timezone', 'UTC')));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow(); // unfreeze
        parent::tearDown();
    }
}
