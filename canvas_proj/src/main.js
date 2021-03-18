import Vue from 'vue';
import router from '@/router';

// vue-fontawesome
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';

// bootstrap
import Bootstrap from 'bootstrap-vue';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';

// color-picker-wheel
import ColorPicker from 'vue-color-picker-wheel';

import App from './App';

Vue.config.productionTip = false;

Vue.use(Bootstrap);
library.add(far, fas);

Vue.component('FontAwesome', FontAwesomeIcon);
Vue.component('ColorPicker', ColorPicker);

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app');
