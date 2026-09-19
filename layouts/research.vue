<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <MobileNav />
    <div class="flex min-h-0 flex-1">
      <AppSidebar />
      <main class="min-w-0 flex-1 overflow-auto p-4 lg:p-5">
        <slot />
      </main>
    </div>
  </div>
</template>
