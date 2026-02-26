import {Audio} from "expo-av";

async function SonidoVerificacion (){
    const {sound} = await Audio.Sound.createAsync(
        require('../../../assets/SonidoVerificacion.mp3')
    );
    await sound.playAsync();
}