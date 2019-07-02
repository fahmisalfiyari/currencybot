const Axios = require("axios"); // Axios library for promisified fetch
BASE_URL = "https://free.currconv.com/api/v7/";

module.exports = {
    /**
   * Get the rate exchange
   * @param {*} source
   * @param {*} destination
   */

    getRate(source, destination){
       query = `${source}_${destination}`;
       return Axios.get(`${BASE_URL}convert?q=${query}&compact=ultra&apiKey=eabf82574d86042a3898`)
    }
};