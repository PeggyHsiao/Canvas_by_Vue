import Vue from 'vue';
import Router from 'vue-router';

import Paint from '@/components/Paint';
import Sample from '@/components/Sample';

Vue.use(Router);

const routes = [
  {
    path: '/',
    name: 'paint',
    component: Paint,
  },
  {
    path: '/test',
    name: 'sample',
    component: Sample,
  },
];

const router = new Router({
  routes,
});

export default router;
