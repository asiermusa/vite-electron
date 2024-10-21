import axios from 'axios';
import store from '../store'
import router from '../router'

const interceptors = () => {

    let api = import.meta.env.VITE_API_URL;

    axios.defaults.baseURL = api;
    axios.interceptors.request.use(
        async (config) => {
                const token = store.replaceState._auth;
                
                if (token) {
                    config.headers['Authorization'] = `Bearer ${ token.token }`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
    );

    axios.interceptors.response.use(response => {
        return response;
    }, error => {
        if (error.response.status === 401) {
            VueCookieNext.removeCookie('auth')
            store.commit("_AUTH", false);
            router.push("/");
        }

        return Promise.reject(error.response);
    });

    return axios;
}

export default interceptors