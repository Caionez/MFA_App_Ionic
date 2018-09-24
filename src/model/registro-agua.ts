export class RegistroAgua {
    dataRegistro: Date;
    valorRegistro: number;

    constructor(dataRegistro: Date, valorRegistro: number) {
        this.dataRegistro = dataRegistro;
        this.valorRegistro = valorRegistro;
    }
}

export class DadosResumidosAgua {
    dataInicialRegistro: Date;
    dataFinalRegistro: Date;
    valorMedio: number = 0;
    quantidadeRegistros: number = 0;
    valorTotal: number = 0;
    
    constructor(registros: Array<RegistroAgua>) {
        
        if (registros.length > 0) {
            this.quantidadeRegistros = registros.length;
            this.dataInicialRegistro = registros[0].dataRegistro;
            this.dataFinalRegistro = registros[registros.length - 1].dataRegistro;
        }
        
        registros.forEach(registro => {
            this.valorTotal += registro.valorRegistro;
        });

        this.valorMedio = this.valorTotal / this.quantidadeRegistros;
    }
}