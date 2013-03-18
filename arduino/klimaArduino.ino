
float temp1C;
float temp2C;
int temp1Pin = A0;
int temp2Pin = A1;
int switchPin= 12;
int ledPin=13;
boolean emergency=false;
boolean switchON=false;
int count=10;
String status;

// the setup routine runs once when you press reset:
void setup() {                
  // initialize the digital pin as an output.
  pinMode(switchPin, OUTPUT); 
  pinMode(ledPin, OUTPUT); 
  Serial.begin(9600);
  delay(1000);
}

// the loop routine runs over and over again forever:
void loop() {
  
  count++;
  
  if (count>10) {
    count=0;
    temp1C = getTemp(temp1Pin);
    temp2C = getTemp(temp2Pin);
    
    Serial.print("T");
    Serial.print(temp1C);
    if (switchON) {
      Serial.print("S1");
    } else {
      Serial.print("S0");
    }
    if (emergency==true) {
      Serial.println("E1");
    } else {
      Serial.println("E0");
    }
    
  }
  
  if (temp1C > 50 && switchON==false) {
    digitalWrite(switchPin, HIGH);
    Serial.println("E-ON");
    emergency=true;
    switchON=true;
    digitalWrite(ledPin,HIGH);
  }
  
  if (emergency==true && temp1C < 50) {
    digitalWrite(switchPin, LOW);
    Serial.println("E-OFF");
    emergency=false;    
    switchON=false;
    digitalWrite(ledPin,LOW);
  }

  delay(100);
  if (Serial.available() > 0) {
    char inputData=Serial.read();
    if (inputData=='1') {
      digitalWrite(switchPin, HIGH);    
      switchON=true;
    } else if (inputData=='0') {
      if (emergency == false) {
        digitalWrite(switchPin, LOW);    
        switchON=false;
      }
    }
  }
}

float getTemp(int pin) {
  float temp=analogRead(pin);
  return  (5.0 * temp * 100.0)/1024.0;  //convert the analog data to temperature
}
