import {Audio} from "expo-av";

export async function SonidoVerificacion (){
    const {sound} = await Audio.Sound.createAsync(
        require('../../../assets/SonidoVerificacion.mp3')
    );
    await sound.playAsync();
}