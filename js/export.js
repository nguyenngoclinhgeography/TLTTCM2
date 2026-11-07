(function(root){
  'use strict';
  const FN=root.FIELDNOTE=root.FIELDNOTE||{};
  const geo=FN.geo;
  const FONT='Arial, "Segoe UI", "Noto Sans", sans-serif';
  const tidy=text=>String(text||'').normalize('NFC').replace(/\s+/g,' ').trim();

  function wrap(ctx,value,width,maxLines){
    const words=tidy(value).split(' ').filter(Boolean);
    if(!words.length)return [];
    const lines=[]; let line='';
    const pushWord=word=>{
      // Long unbroken words are trimmed to avoid writing beyond the image.
      if(ctx.measureText(word).width<=width)return word;
      let lo=0,hi=word.length;
      while(lo<hi){const mid=Math.ceil((lo+hi)/2); if(ctx.measureText(word.slice(0,mid)+'…').width<=width)lo=mid;else hi=mid-1;}
      return word.slice(0,lo)+'…';
    };
    for(const word0 of words){
      const word=pushWord(word0);
      const proposed=line?line+' '+word:word;
      if(ctx.measureText(proposed).width>width && line){lines.push(line);line=word;}
      else line=proposed;
      if(lines.length>=maxLines)break;
    }
    if(line&&lines.length<maxLines)lines.push(line);
    const original=words.join(' ');
    if(lines.length===maxLines && lines.join(' ').replace(/…/g,'').length<original.length){
      let last=lines[maxLines-1].replace(/…$/,'');
      while(last&&ctx.measureText(last+'…').width>width)last=last.slice(0,-1);
      lines[maxLines-1]=last+'…';
    }
    return lines;
  }

  function renderPhoto(image,meta,preview=false){
    if(!image||!image.naturalWidth||!image.naturalHeight)throw Error('Ảnh chưa tải xong.');
    // Max side prevents Canvas memory errors while retaining details for reports.
    const maxSide=preview?1260:5200;
    const scale=Math.min(1,maxSide/image.naturalWidth,maxSide/image.naturalHeight);
    const width=Math.max(1,Math.round(image.naturalWidth*scale));
    const height=Math.max(1,Math.round(image.naturalHeight*scale));
    const unit=Math.max(14,Math.min(41,width*.027));
    const padding=Math.max(16,Math.round(unit*1.12));
    const usable=width-padding*2;
    if(usable<20)throw Error('Ảnh có chiều rộng quá nhỏ.');
    const titleSize=unit*1.32,subSize=unit*.98,bodySize=unit*.83,minorSize=unit*.75;
    const gap=unit*.33;
    const test=document.createElement('canvas').getContext('2d');
    test.font=`700 ${titleSize}px ${FONT}`;
    const place=wrap(test,tidy(meta.place||'Địa điểm khảo sát').toLocaleUpperCase('vi-VN'),usable,2);
    test.font=`600 ${subSize}px ${FONT}`;
    const title=wrap(test,meta.title||'',usable,2);
    test.font=`${bodySize}px ${FONT}`;
    const description=wrap(test,meta.description||'',usable,3);
    const date=geo.dateText(meta.date);
    const detailParts=[date?`NGÀY CHỤP: ${date}`:'',meta.time?`GIỜ: ${tidy(meta.time)}`:'',meta.author?`NGUỒN ẢNH: ${tidy(meta.author)}`:''].filter(Boolean);
    const detail=detailParts.join('   ·   ');
    const lat=Number(meta.lat),lng=Number(meta.lng);
    const coord=(meta.lat!==''&&meta.lng!==''&&geo.valid(lat,lng))?`TỌA ĐỘ KHẢO SÁT: ${lat.toFixed(6)}, ${lng.toFixed(6)}`:'';
    test.font=`${minorSize}px ${FONT}`;
    const dateLines=wrap(test,detail,usable,3);
    const coordLines=wrap(test,coord,usable,2);
    const headerSize=unit*.84;
    const line=(count,size,multiple)=>count*size*multiple;
    const stripHeight=Math.ceil(padding*2+headerSize+unit*.70+
      line(place.length,titleSize,1.22)+gap+
      (title.length?line(title.length,subSize,1.28)+gap:0)+
      (description.length?line(description.length,bodySize,1.42)+gap:0)+
      (dateLines.length||coordLines.length?unit*.65+line(dateLines.length+coordLines.length,minorSize,1.45)+
        (dateLines.length&&coordLines.length?gap:0):0));
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height+stripHeight;
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('Trình duyệt không hỗ trợ xử lý ảnh.');
    ctx.drawImage(image,0,0,width,height);
    ctx.fillStyle='#142d40';ctx.fillRect(0,height,width,stripHeight);
    ctx.fillStyle='#c8a274';ctx.fillRect(0,height,width,Math.max(3,unit*.11));
    ctx.textBaseline='top';let y=height+padding;
    ctx.font=`700 ${headerSize}px ${FONT}`;ctx.fillStyle='#e7c698';
    let head='THỰC TẾ CHUYÊN MÔN K49';
    const code=tidy(meta.code).toLocaleUpperCase('vi-VN').slice(0,28);
    if(code&&ctx.measureText(head).width+ctx.measureText(code).width+unit*.9>usable)head='FIELDNOTE K49';
    ctx.fillText(head,padding,y);
    if(code){ctx.textAlign='right';ctx.fillText(code,width-padding,y);ctx.textAlign='left';}
    y+=headerSize+unit*.70;
    ctx.font=`700 ${titleSize}px ${FONT}`;ctx.fillStyle='#fff';
    for(const row of place){ctx.fillText(row,padding,y);y+=titleSize*1.22;}
    y+=gap;
    ctx.font=`600 ${subSize}px ${FONT}`;ctx.fillStyle='#f0f3f5';
    for(const row of title){ctx.fillText(row,padding,y);y+=subSize*1.28;}
    if(title.length)y+=gap;
    ctx.font=`${bodySize}px ${FONT}`;ctx.fillStyle='#d9e5e9';
    for(const row of description){ctx.fillText(row,padding,y);y+=bodySize*1.42;}
    if(description.length)y+=gap;
    if(dateLines.length||coordLines.length){
      ctx.strokeStyle='#547084';ctx.lineWidth=Math.max(1,unit*.045);
      ctx.beginPath();ctx.moveTo(padding,y+unit*.1);ctx.lineTo(width-padding,y+unit*.1);ctx.stroke();
      y+=unit*.65;ctx.font=`${minorSize}px ${FONT}`;ctx.fillStyle='#cbdce6';
      for(const row of dateLines){ctx.fillText(row,padding,y);y+=minorSize*1.45;}
      if(dateLines.length&&coordLines.length)y+=gap;
      for(const row of coordLines){ctx.fillText(row,padding,y);y+=minorSize*1.45;}
    }
    return canvas;
  }
  function canvasBlob(canvas){return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Không xuất được ảnh PNG.')),'image/png'));}
  function download(blob,filename){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);}
  FN.exporter={renderPhoto,canvasBlob,download};
})(window);
