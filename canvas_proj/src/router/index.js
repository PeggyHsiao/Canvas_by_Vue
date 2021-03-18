import Vue from 'vue';
import Router from 'vue-router';

import Paint from '@/components/Paint';

Vue.use(Router);

const routes = [
  {
    path: '/',
    name: 'paint',
    component: Paint,
  },
];

const router = new Router({
  routes,
});

export default router;
