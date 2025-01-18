<template>
  <div class="hello">
    <v-row align="center" no-gutters>
      <v-col cols="6"><h2 class="main-title">Funtzionamendua</h2> </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <h3 class="mb-6" color="primary">1. WordPress Zerbitzaria</h3>

        <h4>Zure lasterketako datu guztiak godeko diren tokia.</h4>
        <ul>
          <li>
            Drive karpetaren identifikatzailea eta excel orrialdearen izenak
            zehaztu.
          </li>
          <li>Splitak zehaztu. (10K, 21K...).</li>
          <li>
            Denbora minimoak, lasterketa hasi den momentutik eta split hortik
            pasatzeko denbora minimoa zehazten du.
          </li>
          <li>
            Denborak maximoak (gehienetan hutsik utzi), puntu jakin baterako
            denbora maximoa zehazten du. Adibidez:
          </li>
        </ul>

        <v-alert
          title="Denbora maximoa"
          type="info"
          variant="tonal"
          density="compact"
        >
          Lasterketa baten hasiera neurtzen badugu, litekeena da etiketaren bat
          ez irakurtzea (momentu berean asko pasattzne direlako). Hortaz denbora
          maximoa 02:00 minutu jarrita, lasterketa hasi den unetik eta bi minutu
          igarota, hurrengo irakurketarako etiketa guztiak hurrengo splitera
          pasako dira.
        </v-alert>
      </v-col>

      <v-col cols="12">
        <h3 class="mb-6" color="primary">2. Splitak.</h3>

        <ul>
          <li>
            Lasterketa jakin batek dituen split guztiak izango dituzu aukeran.
            Fisikoki zure gailuak zer kronometratuko duen zehaztuko da hemen.
          </li>
          <li>
            Gailu fisiko bakoitza (ordenagailu zein mugikorrak) zein lekutan
            egongo den zehaztuko du.
          </li>
        </ul>
      </v-col>

      <v-col cols="12">
        <h3 class="mb-6" color="primary">3. Parte-hartzaileak</h3>

        <h4>
          Drivean dagoen excela eskuratu. (automatikoki egiten du sistemak).
        </h4>

        <ul>
          <li>
            Hemen ezin da berez ezer editatu, baina dortsalen asignazioa egiteko
            erabiltzen da.
          </li>
          <li>
            Behin dortsalak asignatuta berriz ere gorde gailu guztiek izan
            dezaten aldaketa honen berri.
          </li>
          <li>
            Etiketarik zehaztuta ez duen parte-hartzailea ignoratu egingo da.
            Kontutan izan hau.
          </li>
        </ul>

        <v-alert
          title="Garrantzitsua"
          type="info"
          variant="tonal"
          density="compact"
        >
          Lasterketa hasi aurretik eta Driveko zerrenda guztiz osatuta
          dagoenean, Zerbitzarian gorde botoi laranja klikatu. Honek zerrenda
          hau guztiz erabilgarri egingo du eskuz kronometratzen dabiltzan
          gailuentzako.
        </v-alert>
      </v-col>

      <v-col cols="12">
        <h3 class="mb-6" color="primary">4. Lasterketa/k abiarazi</h3>

        <ul>
          <li>
            Readerra konektatu (dagokion IP zenbakiarekin) eta irakurketak egin
            ditzakezula bermatu.
          </li>
          <li>
            Irakurketak egin ahala
            <v-chip color="orange" size="small">Zerbitzarian Gorde </v-chip>
            botoi laranja erabili datuak zerbitzarian gordetzeko.
          </li>
        </ul>

        <v-alert
          title="Garrantzitsua"
          color="default"
          variant="tonal"
          density="compact"
        >
          Garrantzitsua: Datuak zerbitzarian gorde ahala, hauek erabilgarri
          izango dira sailkapenak osatu ahal izateko, behin-behinekoak eta
          behin-betikoak.
        </v-alert>
      </v-col>

      <v-col cols="12">
        <h3 class="mb-6" color="primary">5. Sailkapenak</h3>

        <h4>Aurretik zehaztu bezala bi faktore izango dira kontutan hemen:</h4>

        <ul>
          <li>
            Parte-hartzaile zerrenda eta jasotako sailkapenak. Bi kasuetan
            jasotako CSV fitxategiak kontrastatuko dira. <br />Parte-hartzaile
            zerrenda bakarra izango da, hau da, aldatzen den bakoitzen
            gain-idatzi egingo da.
          </li>
          <li>
            Sailkapenak gailu bakoitzak bidalitako CSV fiitxategi bat izango
            dira.
          </li>
          <li>
            Sailkapenak osatzeko lasterketa baterako jaso diren guztiak iragazi,
            splitak, parte-hartzaile duplikatuak... kontrastatu eta sailkapen
            orokor bat itzuliko da, baita PDF bat ere.
          </li>
        </ul>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: "HelpComponent",
};
</script>

<style lang="scss" scoped>
h4 {
  margin: 20px 0;
}
ul {
  font-size: 16px !important;
  list-style: circle !important;
  margin: 30px 0;
  li {
    margin-left: 40px;
  }
}
</style>
