import {Audio} from "expo-av";

export async function SonidoVerificacion (){
    const {sound} = await Audio.Sound.createAsync(
        require('../../../assets/sonido_verificacion.mp3')
    );
    await sound.playAsync();
}