import axios from "axios";
const baseUrlApi = 'https://subscriptionstaging.webcontrive.com/wishlist-club/public/api';
// const baseUrlApi = 'https://wishlist.thimatic-apps.com/api/public/api';
let instance = axios.create();
export class ApiService {
    async getData(url) {
        let resData = '';
        let response = '';
        await instance.get(url).then((res) => {
            if (res.data.status === 200) {
                response = res.data;
            } else {
                response = res.data
            }
        }).catch((e) => {
            resData = e && e.response && e.response.data;
        })
        return resData || response
    }
    async postDataShopify(url, data) {
        const config = {
            headers: {
                "Content-Type": "application/json",
            },
        }
        let resData = '';
        let response = '';
        await instance.post(url, data, config).then((res) => {
            if (res.status === 200) {
                response = { ...res.data, status: res.status };
            } else {
                response = { ...res.data, status: res.status };
            }
        }).catch((e) => {
            resData = { ...e.response.data, status: e.response.status };
        })
        return resData || response
    }
    async postData(url, data) {
        const config = {
            headers: {
                "Content-Type": "application/json",
            },
        }
        let resData = '';
        let response = '';
        await instance.post(url, data, config).then((res) => {
            if (res.data.status === 200) {
                response = res.data;
            } else {
                response = res.data
            }
        }).catch((e) => {
            resData = e.response.data;
        })
        return resData || response
    }
    async addCartAPI(payload) {
        return await this.postDataShopify(`/cart/add.json`, payload);
    }
    async getSetting(payload) {
        return await this.postData(`${baseUrlApi}/v2/setting`, payload);
    }
    async getbaclInstock(payload) {
        return await this.postData(`${baseUrlApi}/v3/bis`, payload);
    }
    async getproduact(payload) {
        return await this.postData(`${baseUrlApi}/v3/products`, payload);
    }
    async createWishlist(payload) {
        return await this.postData(`${baseUrlApi}/v3/wishlist`, payload);
    }
    async removeWishlistTab(payload) {
        return await this.postData(`${baseUrlApi}/v1/removetab`, payload);
    }
    async addWishlist(payload) {
        return await this.postData(`${baseUrlApi}/v3/add`, payload);
    }
    async removeWishlist(payload) {
        return await this.postData(`${baseUrlApi}/v3/remove`, payload);
    }
    async getWishlists(payload) {
        return await this.postData(`${baseUrlApi}/v3/wishlists`, payload);
    }
    // ====== wishlist Page 
    async getWishlistsV4(payload) {
        return await this.postData(`${baseUrlApi}/v4/get`, payload);
    }
    async fetchWishlistFolders(payload) {
        return await this.postData(`${baseUrlApi}/v2/folder-wishlist`, payload);
    }
    async WishlistQuantity(payload) {
        return await this.postData(`${baseUrlApi}/v1/quantity`, payload);
    }
    async WishlistRemove(payload) {
        return await this.postData(`${baseUrlApi}/v1/remove`, payload);
    }
    async WishlistTabRemove(payload) {
        return await this.postData(`${baseUrlApi}/v1/removetab`, payload);
    }
    async Wishlistcart(payload) {
        return await this.postData(`${baseUrlApi}/v1/cart`, payload);
    }
    async WishlistTabRename(payload) {
        return await this.postData(`${baseUrlApi}/v3/rename`, payload);
    }
    async clearCart(payload) {
        return await this.getData(`/cart/clear.js`, payload);
    }
    async addToCart(payload) {
        return await this.postData(`/cart/add.js`, payload);
    }
}