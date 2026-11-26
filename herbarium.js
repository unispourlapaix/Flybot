(function(){
  var book=document.getElementById('flower-book'), open=document.getElementById('flower-book-open');
  var list=document.getElementById('flower-book-list'), plate=document.getElementById('flower-book-plate');
  var count=document.getElementById('flower-book-count'), total=flowerPlates.length, selected=0;
  var unlocked=0;
  try {
    var saved=Number(window.localStorage.getItem('flybot-herbarium-v1'));
    if(Number.isInteger(saved)) unlocked=Math.max(0,Math.min(total,saved));
  }catch(error){}
  window.recordPollination=function(){
    if(unlocked>=total) return;
    selected=unlocked++;
    try{window.localStorage.setItem('flybot-herbarium-v1',String(unlocked));}catch(error){}
    refreshBadge();
  };
  window.flowerBookIsOpen=function(){return book.open;};
  function node(tag,content,className){
    var el=document.createElement(tag);
    if(content) el.textContent=content;
    if(className) el.className=className;
    return el;
  }
  function illustration(row,index){
    var ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    function shape(tag,attrs,parent){
      var el=document.createElementNS(ns,tag);
      Object.keys(attrs).forEach(function(k){el.setAttribute(k,attrs[k]);});
      (parent||svg).appendChild(el);return el;
    }
    svg.setAttribute('viewBox','0 0 260 290');svg.setAttribute('aria-hidden','true');
    var ink='#50634c',leaf=['#799065','#8a9970','#667f61','#98a57b'][index%4],color=row[9],form=row[11],n=Number(row[10]);
    shape('rect',{x:12,y:12,width:236,height:266,rx:2,fill:'none',stroke:'#c9b894'});
    shape('path',{d:'M126 253 Q110 200 130 142 Q145 103 129 68',fill:'none',stroke:ink,'stroke-width':3});
    for(var i=0;i<4;i++){
      var y=228-i*29,x=122+(i>1?9:0),side=i%2===0?-1:1,len=39+(index+i*7)%18;
      shape('path',{d:'M'+x+' '+y+' q '+(side*len*.26)+' -35 '+(side*len)+' -23 q '+(-side*len*.17)+' 25 '+(-side*len)+' 23',fill:leaf,stroke:ink,'stroke-width':.9});
      shape('path',{d:'M'+x+' '+y+' q '+(side*len*.5)+' -16 '+(side*len)+' -23',fill:'none',stroke:ink,'stroke-width':.75});
    }
    function bloom(x,y,size,kind){
      var group=shape('g',{transform:'translate('+x+' '+y+') scale('+size+')',fill:color,stroke:'#524452','stroke-width':.8});
      if(kind==='bells'||kind==='drop'){
        shape('path',{d:'M-9 -14 Q0 -24 9 -14 L17 12 Q10 9 4 16 Q0 11 -4 16 Q-10 9 -17 12 Z'},group);
        shape('path',{d:'M-6 -12 L-8 10 M4 -12 L7 11',fill:'none',opacity:.42},group);return;
      }
      if(kind==='cup'){
        shape('path',{d:'M-31 -23 Q-20 -32 -8 -16 Q0 -38 9 -17 Q22 -32 31 -23 Q27 17 0 20 Q-27 16 -31 -23 Z'},group);
        shape('path',{d:'M0 16 Q-12 3 -8 -16 M0 16 Q13 2 9 -17',fill:'none',opacity:.5},group);
      }else{
        var petal=kind==='star'?'M0 4 Q-19 -10 0 -35 Q19 -10 0 4':kind==='iris'||kind==='reflex'?'M0 3 C-26 -9 -9 -42 12 -31 C17 -20 3 -9 0 3':'M0 4 C-23 -10 -'+(kind==='ray'?12:26)+' -34 0 -35 C'+(kind==='ray'?12:26)+' -34 23 -10 0 4';
        for(var j=0;j<n;j++){
          var angle=j*360/n;
          shape('path',{d:petal,transform:'rotate('+angle+')',opacity:.9},group);
          shape('path',{d:'M0 -5 Q-4 -17 0 -27',transform:'rotate('+angle+')',fill:'none',opacity:.28},group);
        }
      }
      shape('circle',{r:kind==='cup'?4:(row[0]==='sunflower'?14:7),fill:row[0]==='sunflower'||row[0]==='poppy'?'#634737':'#d4a74d'},group);
      for(var k=0;k<6;k++) shape('circle',{cx:Math.cos(k)*4,cy:Math.sin(k)*4,r:.8,fill:'#f9e0a1',stroke:'none'},group);
    }
    if(form==='spike'||form==='bells'){
      for(var j=0;j<6;j++){
        var y=42+j*15,x=130+(j%2?1:-1)*(j*3);
        shape('path',{d:'M130 '+(y+8)+' L'+x+' '+y,stroke:ink});
        bloom(x,y,.29+j*.045,form==='bells'?'bells':'round');
      }
    }else if(form==='cluster'){
      for(var j=0;j<7;j++){
        var x=85+j*15,y=65+Math.abs(j-3)*7+(j%2)*6;
        shape('path',{d:'M130 142 Q129 103 '+x+' '+y,fill:'none',stroke:ink});
        bloom(x,y,.36, 'round');
      }
    }else if(form==='drop'){
      shape('path',{d:'M129 90 Q126 41 159 50 L159 67',fill:'none',stroke:ink,'stroke-width':2});
      bloom(159,81,1.22,'drop');
    }else{
      bloom(129,68,form==='ray'?1.12:1.04,form);
    }
    var number=shape('text',{x:27,y:261,fill:'#7c6b55','font-size':12,'font-family':'serif'});
    number.textContent='№ '+String(index+1).padStart(2,'0');
    return svg;
  }
  function artwork(row,index,name){
    var frame=node('div','','herbarium-artwork');
    var image=node('img');
    image.alt=name;
    image.style.left=(index%2?-100:0)+'%';
    image.style.top=(Math.floor(index/2)%2?-100:0)+'%';
    image.addEventListener('error',function(){
      frame.className='';
      frame.replaceChildren(illustration(row,index));
    });
    image.src='images/herbarium/plate-'+String(Math.floor(index/4)+1).padStart(2,'0')+'.webp';
    frame.appendChild(image);
    return frame;
  }
  function refreshBadge(){
    setIconButton(open,'flower',tr('flowerBook')+' · '+unlocked+'/'+total);
    open.title=tr('flowerBook')+' · '+unlocked+'/'+total;
  }
  function renderBook(focusSelected){
    var langIndex={fr:1,en:2,es:3,ja:4}[language]||1;
    count.textContent=unlocked+' / '+total;
    list.replaceChildren();plate.replaceChildren();
    var active;
    flowerPlates.forEach(function(row,i){
      var known=i<unlocked;
      var button=node('button',String(i+1).padStart(2,'0')+' · '+(known?row[langIndex]:'🔒 '+tr('flowerUnknown')));
      button.type='button';button.disabled=!known;
      if(!known) button.setAttribute('aria-label',(i+1)+' · '+tr('flowerUnknown'));
      if(known && i===selected){button.setAttribute('aria-current','true');active=button;}
      if(known) button.addEventListener('click',function(){selected=i;renderBook(true);});
      list.appendChild(button);
    });
    if(unlocked){
      var row=flowerPlates[selected];
      plate.append(artwork(row,selected,row[langIndex]),node('h3',row[langIndex]),node('p',row[langIndex+4]));
    }else{
      plate.append(node('span','✿','flower-book-empty'),node('p',tr('flowerBookHint')));
    }
    if(focusSelected && active) active.focus();
  }
  window.refreshFlowerBook=function(){refreshBadge();if(book.open) renderBook(false);};
  open.addEventListener('click',function(){
    if(book.open) return;
    keys={};renderBook(false);book.showModal();
  });
  book.addEventListener('close',function(){
    keys={};state.touchX=state.butterfly.x;state.touchY=state.butterfly.y;
    tilt.neutral=null;tilt.x=0;tilt.y=0;open.focus();
  });
  refreshBadge();
})();
